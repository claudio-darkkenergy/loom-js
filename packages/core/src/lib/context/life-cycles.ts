import { canDebug } from '../../config';
import type {
    ComponentContextPartial,
    LifeCycleEvent,
    LifeCycleHandler,
    LifeCycleHookProps
} from '../../types';
import { getDocument, getWindow } from '../dom';
import {
    createDiagnosticSubject,
    formatDiagnostic
} from '../globals/diagnostic-format';
import { loomConsole } from '../globals/loom-console';
import { getContextRootAnchor, getShareableContext } from './helpers';

// Holds reference to the life-cycle handlers for each component node.
const lifeCycleNodes = new Map<Node, ComponentContextPartial>();

const lifeCycleEvents: LifeCycleEvent[] = [
    'beforeRender',
    'created',
    'mounted',
    'rendered',
    'unmounted'
];

/*
 * Life-cycle hooks occur in the following order:
 *      1. Created - once per component creation.
 *      2. Before Render - called before the component renders.
 *      3. Rendered - 1st time a component is rendered,
 *                  - again for every `effect` update after the 1st one.
 *      -- Note: `onAppMounted` is called here before the next life-cycle hooks are called.
 *      4. Mounted - nodes are connected to the DOM,
 *                 - processed for each component from the queue, 1st-in/out, during the 1st mounted cycle,
 *                 - & again when new nodes are mounted, observed by the `MutationObserver`.
 *      5. Unmounted - nodes are disconnected from the DOM,
 *                   - processed for each component, observed by the `MutationObserver`.
 */
export const _lifeCycles = {
    /**
     * Initializes the life-cycle hooks for a given node.
     * The component has been created, but not mounted.
     * @param ctx `ComponentContextPartial` which holds life-cycle handlers for the node.
     */
    creation(ctx: ComponentContextPartial) {
        // Creation life-cycle handler - only once.
        if (ctx.lifeCycleState) {
            // Creation life-cycle handler - only once.
            const root = getContextRootAnchor(ctx);

            if (root && !lifeCycleNodes.has(root)) {
                lifeCycleNodes.set(root, ctx);

                dispatchLifeCycle(ctx, 'created');
            }
        }
    },
    /**
     * Kicks off the observation via `MutationObserver` to listen for DOM tree adds/removals.
     * @param observableNode The App node to observe for changes in its DOM tree.
     */
    observe(observableNode: Element) {
        const canDebugMutations = canDebug('mutations');
        const observer = new (getWindow().MutationObserver)(domChanged);

        canDebugMutations &&
            loomConsole.groupCollapsed(
                ...formatDiagnostic({ event: 'mounting', scope: 'mutations' })
            );

        // Observe future DOM updates.
        observer.observe(observableNode, { childList: true, subtree: true });
        // Execute all the `onMounted` handlers since all the nodes are now in the DOM.
        lifeCycleNodes.forEach((ctx, node) => {
            const root = getContextRootAnchor(ctx);

            if (root && getDocument().contains(root) && ctx.lifeCycleState) {
                dispatchLifeCycle(ctx, 'mounted');
                canDebugMutations &&
                    loomConsole.info(
                        ...formatDiagnostic({
                            event: 'mounted',
                            scope: 'mutations',
                            subject: ctx.key
                                ? createDiagnosticSubject(
                                      'component',
                                      String(ctx.key)
                                  )
                                : undefined
                        }),
                        node,
                        getShareableContext(ctx)
                    );
            } else {
                lifeCycleNodes.delete(node);
            }
        });

        canDebugMutations && loomConsole.groupEnd();
    },
    /**
     * Releases every registration whose node belongs to `doc`. Server renders
     * never reach `observe`/`MutationObserver` cleanup, so without this each
     * `renderToString` call would leave its contexts in the registry forever.
     * @param doc The (injected) document whose render has completed.
     */
    release(doc: Document) {
        lifeCycleNodes.forEach((_ctx, node) => {
            if (node.ownerDocument === doc) {
                lifeCycleNodes.delete(node);
            }
        });
    },
    preRender(ctx: ComponentContextPartial) {
        // Before-rendered life-cycle handler - called on every render.
        if (ctx.lifeCycleState) {
            dispatchLifeCycle(ctx, 'beforeRender');
        }
    },
    postRender(ctx: ComponentContextPartial) {
        // Rendered life-cycle handler - called on every render.
        if (ctx.lifeCycleState) {
            dispatchLifeCycle(ctx, 'rendered');
        }
    }
};

// Visits a mutated node and every element under it — the places a context
// root can be registered. One native collection per node, no walker.
const forEachRegistrable = (node: Node, visit: (node: Node) => void) => {
    visit(node);

    if (node.nodeType === 1) {
        const descendants = (node as Element).getElementsByTagName('*');

        for (let index = 0; index < descendants.length; index++) {
            visit(descendants[index] as Element);
        }
    }
};

/**
 * The `MutationCallback` to get call by the `MutationObserver` on DOM mutations.
 * @param diffNodes The nodes which have been added or removed from the DOM.
 */
const domChanged: MutationCallback = (diffNodes) => {
    // Nothing registered — nothing in this batch can mount or unmount.
    if (!lifeCycleNodes.size) {
        return;
    }

    const canDebugMutations = canDebug('mutations');
    // Removal candidates collected across the whole batch — a node that is
    // removed and re-inserted within the same batch (a move, e.g. an array
    // reorder) must not unmount, so resolution waits until every record has
    // been processed (see the batch-end pass below).
    const removalCandidates = new Map<Node, ComponentContextPartial>();

    canDebugMutations &&
        loomConsole.groupCollapsed(
            ...formatDiagnostic({ event: 'mutating', scope: 'mutations' })
        );

    diffNodes.forEach(({ addedNodes, removedNodes, type }) => {
        switch (type) {
            case 'childList':
                // Collect removal candidates.
                if (removedNodes.length) {
                    const collect = (node: Node) => {
                        const ctx = lifeCycleNodes.get(node);

                        ctx?.lifeCycleState && removalCandidates.set(node, ctx);
                    };

                    removedNodes.forEach((node) =>
                        forEachRegistrable(node, collect)
                    );
                }

                // Handle added nodes.
                if (addedNodes.length) {
                    const handleMount = (node: Node) => {
                        const ctx = lifeCycleNodes.get(node);

                        if (ctx?.lifeCycleState) {
                            dispatchLifeCycle(ctx, 'mounted');
                            canDebugMutations &&
                                loomConsole.info(
                                    ...formatDiagnostic({
                                        event: 'mounted',
                                        scope: 'mutations',
                                        subject: ctx.key
                                            ? createDiagnosticSubject(
                                                  'component',
                                                  String(ctx.key)
                                              )
                                            : undefined
                                    }),
                                    node,
                                    getShareableContext(ctx)
                                );
                        }
                    };

                    // Calls the `onMounted` life-cycle handler for each added node if defined.
                    addedNodes.forEach((node) =>
                        forEachRegistrable(node, handleMount)
                    );
                }
        }
    });

    // Batch-end resolution: only genuinely detached candidates unmount and
    // tear down — moved-but-still-attached nodes keep their registration
    // and subscriptions.
    const detachedContexts: ComponentContextPartial[] = [];

    removalCandidates.forEach((ctx, node) => {
        if (getDocument().contains(node)) {
            return;
        }

        lifeCycleNodes.delete(node);

        if (ctx.lifeCycleState) {
            dispatchLifeCycle(ctx, 'unmounted');
        }

        detachedContexts.push(ctx);
        canDebugMutations &&
            loomConsole.info(
                ...formatDiagnostic({
                    event: 'unmounted',
                    scope: 'mutations',
                    subject: ctx.key
                        ? createDiagnosticSubject('component', String(ctx.key))
                        : undefined
                }),
                node,
                getShareableContext(ctx)
            );
    });

    // Teardown waits until every `onUnmounted` has fired — it cascades into
    // child contexts and drops their handlers.
    detachedContexts.forEach(teardownContext);

    canDebugMutations && loomConsole.groupEnd();
};

// Runs and clears a detached context's cleanup callbacks, cascading through
// its child contexts. The context objects themselves stay in their parents'
// `children` maps (persistence is untouched) — only subscriptions are
// released; a later render re-subscribes through the effect's first-call
// guard.
const teardownContext = (ctx: ComponentContextPartial) => {
    ctx.teardowns?.forEach((teardown) => teardown());
    ctx.teardowns?.clear();
    // Owned values (`own`) live exactly as long as the mounted context — a
    // remount re-creates them through a fresh first render.
    delete ctx.owned;
    // Handlers close over the render that registered them, so a remount
    // registers its own. Handlers given through a `ref` live on the ref.
    lifeCycleEvents.forEach((event) => (ctx[event] = []));
    ctx.children?.forEach((childCtx) => teardownContext(childCtx));
};

/*
 * Life-cycle hooks occur in the following order:
 *      1. Created - once per component creation.
 *      2. Before Render - called before the component renders.
 *      3. Rendered - 1st time a component is rendered,
 *                  - again for every `effect` update after the 1st one.
 *      -- Note: `onAppMounted` is called here before the next life-cycle hooks are called.
 *      4. Mounted - nodes are connected to the DOM,
 *                 - processed for each component from the queue, 1st-in/out, during the 1st mounted cycle,
 *                 - & again when new nodes are mounted, observed by the `MutationObserver`.
 *      5. Unmounted - nodes are disconnected from the DOM,
 *                   - processed for each component, observed by the `MutationObserver`.
 */
export const lifeCycles: (
    ctx: ComponentContextPartial
) => LifeCycleHookProps = (ctx) => {
    ctx.lifeCycleState = { value: null };
    lifeCycleEvents.forEach((event) => (ctx[event] = []));

    return {
        onBeforeRender(handler) {
            registerLifeCycleHandler('beforeRender', { ctx, handler });
        },
        onCreated(handler) {
            registerLifeCycleHandler('created', { ctx, handler });
        },
        onMounted(handler) {
            registerLifeCycleHandler('mounted', { ctx, handler });
        },
        onRendered(handler) {
            registerLifeCycleHandler('rendered', { ctx, handler });
        },
        onUnmounted(handler) {
            registerLifeCycleHandler('unmounted', { ctx, handler });
        }
    };
};

// Appends while the event's list is open: empty, or already filled by the
// render in progress (`registering` is reset per render by `component`).
// A later render's call against a filled list is a no-op, so the list locks
// once its registering render ends.
const registerLifeCycleHandler = (
    event: LifeCycleEvent,
    {
        ctx,
        handler
    }: { ctx: ComponentContextPartial; handler: LifeCycleHandler }
) => {
    const handlers = ctx[event];

    if (!handlers || (handlers.length && !ctx.registering?.has(event))) {
        return;
    }

    handlers.push(handler);
    (ctx.registering ??= new Set()).add(event);
};

// Moves the instance to `event` and runs its handlers in registration
// order, then the handler a parent registered through the component's
// `ref`. Setting the state it already holds runs nothing.
const dispatchLifeCycle = (
    ctx: ComponentContextPartial,
    event: LifeCycleEvent
) => {
    const state = ctx.lifeCycleState;

    if (!state || state.value === event) {
        return;
    }

    state.value = event;
    ctx[event]?.forEach((handler) => handler(ctx.root));
    ctx.ref?.[event]?.(ctx.root);
};
