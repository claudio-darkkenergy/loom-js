// The in-page backend: answers frontend requests against the live app and
// pushes frame-batched events for the topics a frontend subscribed to.
// Core's devtools hook is installed only while a push topic is subscribed.
import {
    type ComponentContextPartial,
    type DevtoolsBackend,
    type DevtoolsHook,
    type InspectableActivity,
    inspectContext,
    isInspectableActivity,
    kindOf,
    nodeNameOf,
    setDevtoolsHook,
    takeBufferedEvents
} from '@loom-js/core/devtools';

import { MISSING, resolvePath } from '../protocol/encode';
import { createTransport, envelope } from '../protocol/transport';
import {
    type Envelope,
    type ErrorCode,
    type Events,
    type EventType,
    PROTOCOL_VERSION,
    type PathKey,
    type Placement,
    type Requests,
    type RequestType,
    type Topic
} from '../protocol/types';
import { installConsoleApi } from './console-api';
import { installFormatters } from './formatters';
import { createHosts } from './hosts';
import { createIdRegistry } from './ids';
import { createInspector, isJsonValue } from './inspect';
import { createPageLayer } from './page-layer';
import { createPerfTracks } from './perf';

const FEATURES: Topic[] = ['activities', 'flash', 'perf', 'renders', 'tree'];
const FLUSH_FALLBACK_MS = 100;

class RequestError extends Error {
    constructor(
        readonly code: ErrorCode,
        message: string
    ) {
        super(message);
    }
}

type Handlers = {
    [Type in Exclude<RequestType, 'hello'>]: (
        payload: Requests[Type][0]
    ) => Requests[Type][1];
};

const randomSession = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export interface BackendOptions {
    // Accepts windows beyond the backend's own dock and popup as peers.
    acceptPeer?(source: Window): boolean;
}

/**
 * Starts a backend in a page: the protocol endpoint, the page layer and the
 * console formatters.
 * @param view The inspected page's window.
 * @param options Extra peer acceptance (test harnesses).
 * @returns The running backend.
 */
export const createBackend = (
    view: Window & typeof globalThis,
    { acceptPeer }: BackendOptions = {}
): DevtoolsBackend => {
    const session = randomSession();
    const ids = createIdRegistry();
    const inspector = createInspector(ids);
    const layer = createPageLayer(view.document, nodeNameOf);
    const hosts = createHosts(view);
    const transport = createTransport(view);
    const perf = createPerfTracks();
    const removeFormatters = installFormatters(view);
    const removeConsoleApi = installConsoleApi(view);
    // Windows that completed `hello`.
    const peers = new Set<Window>();
    const topics = new Set<Topic>();
    const watched = new Map<InspectableActivity, () => void>();
    const changed = new Set<ComponentContextPartial>();
    const renders: { ctx: ComponentContextPartial; ms: number }[] = [];
    const activityChanges = new Set<InspectableActivity>();
    let frameRequested = false;
    let selectedId: number | undefined;

    const emit = <Type extends EventType>(type: Type, payload: Events[Type]) =>
        peers.forEach((peer) =>
            transport.post(
                peer,
                envelope({ kind: 'event', payload, session, type })
            )
        );

    const contextOf = (id: number) => {
        const ctx = ids.objectOf<ComponentContextPartial>(id);

        if (!ctx || isInspectableActivity(ctx) || !kindOf(ctx)) {
            throw new RequestError('unknown-id', `no instance has id ${id}`);
        }

        return ctx;
    };
    const activityOf = (id: number) => {
        const activity = ids.objectOf(id);

        if (!isInspectableActivity(activity)) {
            throw new RequestError('unknown-id', `no activity has id ${id}`);
        }

        return activity;
    };
    const encodeAt = (root: unknown, path: PathKey[]) => {
        const value = resolvePath(root, path);

        if (value === MISSING) {
            throw new RequestError(
                'unknown-id',
                `nothing at ${path.join('.')}`
            );
        }

        return { value: inspector.encode(value) };
    };

    const watchActivity = (activity: InspectableActivity) => {
        if (watched.has(activity)) {
            return;
        }

        let initial = true;

        watched.set(
            activity,
            activity.watch(() => {
                if (initial) {
                    initial = false;
                    return;
                }

                activityChanges.add(activity);
                topics.has('perf') &&
                    perf.commit(inspector.activityRecord(activity).name);
                requestFrame();
            })
        );
    };
    const unwatchAll = () => {
        watched.forEach((unwatch) => unwatch());
        watched.clear();
    };
    const watchListed = () =>
        inspector
            .listActivities()
            .forEach(({ id }) => watchActivity(activityOf(id)));

    const flush = () => {
        frameRequested = false;

        if (changed.size) {
            emit('tree.changed', {
                ids: Array.from(changed, (ctx) => ids.idOf(ctx))
            });
            changed.clear();
            topics.has('activities') && watchListed();
        }

        if (renders.length) {
            emit('renders', {
                entries: renders.map(({ ctx, ms }) => ({
                    causeId: ctx.activity ? ids.idOf(ctx.activity) : undefined,
                    id: ids.idOf(ctx),
                    ms
                }))
            });
            topics.has('flash') &&
                renders.forEach(({ ctx }) => layer.flash(ctx));
            renders.length = 0;
        }

        activityChanges.forEach((activity) => {
            const { id, pending, value } = inspector.activityRecord(activity);

            emit('activity.changed', { id, pending, value });
        });
        activityChanges.clear();
    };
    // Batches per animation frame; the timer covers pages whose frames are
    // paused (a background tab behind a focused popup).
    const requestFrame = () => {
        if (!frameRequested) {
            frameRequested = true;

            const flushOnce = () => frameRequested && flush();

            view.requestAnimationFrame(flushOnce);
            view.setTimeout(flushOnce, FLUSH_FALLBACK_MS);
        }
    };

    const hook: DevtoolsHook = {
        activityCreated(activity) {
            inspector.noteCreated(activity);
            topics.has('activities') && watchActivity(activity);
        },
        rendered(ctx, ms) {
            topics.has('tree') && changed.add(ctx);
            (topics.has('renders') || topics.has('flash')) &&
                renders.push({ ctx, ms });
            topics.has('perf') && perf.render(nodeNameOf(ctx), ms);
            requestFrame();
        }
    };

    const setTopics = (next: Topic[]) => {
        topics.clear();
        next.forEach((topic) => FEATURES.includes(topic) && topics.add(topic));
        setDevtoolsHook(topics.size ? hook : null);
        topics.has('activities') ? watchListed() : unwatchAll();
    };

    const select = (ctx: ComponentContextPartial | undefined) => {
        selectedId = ctx && ids.idOf(ctx);
        layer.select(ctx);
        selectedId !== undefined && emit('selected', { id: selectedId });
    };

    const handlers: Handlers = {
        'activity.inspect': ({ id, path = [] }) =>
            encodeAt(activityOf(id).value(), path),
        'activity.list': () => ({ activities: inspector.listActivities() }),
        'activity.reset': ({ id }) => {
            activityOf(id).reset();
            return {};
        },
        'activity.update': ({ id, input }) => {
            const activity = activityOf(id);

            if (!isJsonValue(input)) {
                throw new RequestError(
                    'invalid-value',
                    'the input is not JSON'
                );
            }

            if (!isJsonValue(activity.value())) {
                throw new RequestError(
                    'not-editable',
                    'the value is not JSON-representable'
                );
            }

            activity.update(input);
            return {};
        },
        close: () => {
            hosts.close();
            return {};
        },
        highlight: ({ id }) => {
            layer.hover(id === null ? undefined : contextOf(id));
            return {};
        },
        log: ({ id }) => {
            const object = ids.objectOf(id);
            const logged = isInspectableActivity(object)
                ? object
                : inspectContext(contextOf(id));

            (view as unknown as { $loom: unknown }).$loom = logged;
            view.console.log('[loom] $loom =', logged);
            return {};
        },
        'node.inspect': ({ id, path }) => {
            const ctx = contextOf(id);

            if (!path?.length) {
                return inspector.nodeDetails(ctx);
            }

            const [section, ...rest] = path;

            return encodeAt(
                section === 'owned' ? (ctx.owned?.values ?? []) : ctx.props,
                rest
            );
        },
        open: ({ placement }) => {
            hosts.open(placement);
            return {};
        },
        pick: ({ on }) => {
            on
                ? layer.startPicking({
                      hover: () => undefined,
                      pick: (ctx) => {
                          ctx && select(ctx);
                          emit('pick.ended', undefined);
                      }
                  })
                : layer.stopPicking();
            return {};
        },
        reveal: ({ id }) => {
            const { root } = contextOf(id);
            const node = Array.isArray(root) ? root[0] : root;

            (node?.nodeType === 1
                ? (node as Element)
                : node?.parentElement
            )?.scrollIntoView({
                block: 'center'
            });
            return {};
        },
        select: ({ id }) => {
            const ctx = id === null ? undefined : contextOf(id);

            selectedId = ctx ? id! : undefined;
            layer.select(ctx);
            return {};
        },
        subscribe: ({ topics: next }) => {
            setTopics(next);
            return {};
        },
        'tree.get': () => inspector.tree()
    };

    const respond = (request: Envelope, source: Window) => {
        const reply = (fields: Pick<Envelope, 'error' | 'payload'>) =>
            transport.post(
                source,
                envelope({
                    ...fields,
                    id: request.id,
                    kind: 'response',
                    session,
                    type: request.type
                })
            );

        try {
            if (request.protocol !== PROTOCOL_VERSION) {
                throw new RequestError(
                    'protocol-mismatch',
                    `this page speaks devtools protocol ${PROTOCOL_VERSION}, not ${request.protocol}`
                );
            }

            if (request.type === 'hello') {
                peers.add(source);
                return reply({
                    payload: {
                        features: FEATURES,
                        placement: hosts.placementOf(source),
                        selectedId,
                        session
                    }
                });
            }

            if (!peers.has(source)) {
                throw new RequestError('not-connected', 'say hello first');
            }

            const handler = handlers[request.type as keyof Handlers] as
                ((payload: unknown) => unknown) | undefined;

            if (!handler) {
                throw new RequestError(
                    'unknown-type',
                    `unknown request ${request.type}`
                );
            }

            reply({ payload: handler(request.payload) });
        } catch (error) {
            reply({
                error:
                    error instanceof RequestError
                        ? { code: error.code, message: error.message }
                        : { code: 'unknown-type', message: String(error) }
            });
        }
    };

    const isPeer = (source: Window) =>
        hosts.isPeer(source) || !!acceptPeer?.(source);
    const stopListening = transport.listen(isPeer, (message, source) => {
        message.kind === 'request' && respond(message, source);
    });
    const sayGoodbye = () => emit('goodbye', undefined);

    view.addEventListener('pagehide', sayGoodbye);
    // Events buffered while devtools loaded: activities created during boot.
    takeBufferedEvents({
        activityCreated: hook.activityCreated,
        rendered: () => undefined
    });

    return {
        deactivate() {
            sayGoodbye();
            view.removeEventListener('pagehide', sayGoodbye);
            setDevtoolsHook(null);
            unwatchAll();
            stopListening();
            layer.destroy();
            hosts.close();
            removeFormatters();
            removeConsoleApi();
            peers.clear();
        },
        open(placement: Placement) {
            hosts.open(placement);
        },
        select
    };
};

/** Starts the backend in the current page — what core's switch calls. */
export const activate = (): DevtoolsBackend => createBackend(window);
