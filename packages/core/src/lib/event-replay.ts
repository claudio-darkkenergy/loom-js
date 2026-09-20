import { loomConsole } from './globals/loom-console';

// The interactions users actually lose mid-boot — what `replayEvents: true`
// opts into.
const DEFAULT_REPLAY_TYPES = ['click', 'submit'];

// Runaway-interaction guard: recording beyond this drops the oldest entry.
const QUEUE_CAP = 50;

interface RecordedEvent {
    event: Event;
    path: number[];
}

export interface ReplaySession {
    /**
     * Re-dispatches the recorded events in order against the root's current
     * (post-swap) tree, resolving each recorded index path; a path that no
     * longer resolves drops that event with a warning. Detaches the capture
     * listeners first and drains the queue — nothing persists after boot.
     */
    replay(): void;
    /** Detaches the capture listeners without dispatching anything. */
    stop(): void;
}

// The element-child index trail from `root` down to `target` — the
// structural address both trees share via the same-render-path guarantee.
// `null` when the target is not an element under `root`.
const indexPathTo = (
    root: Element,
    target: EventTarget | null
): number[] | null => {
    if (!target || !('parentElement' in target)) {
        return null;
    }

    const path: number[] = [];
    let node = target as Element | null;

    while (node && node !== root) {
        const parent: Element | null = node.parentElement;

        if (!parent) {
            return null;
        }

        path.unshift(Array.prototype.indexOf.call(parent.children, node));
        node = parent;
    }

    return node === root ? path : null;
};

const resolveIndexPath = (root: Element, path: number[]): Element | null => {
    let node: Element | undefined = root;

    for (const childIndex of path) {
        node = node.children[childIndex];

        if (!node) {
            return null;
        }
    }

    return node;
};

// A real constructed event of the same interface, so existing handlers need
// no changes — and construction alone marks it untrusted. The recorded event
// doubles as the init dictionary, carrying the constructor essentials
// (buttons, coordinates, bubbling). `submit` is rebuilt bare: its init would
// otherwise carry the served tree's `submitter` node into the client
// dispatch.
const rebuildEvent = (event: Event): Event => {
    const EventInterface = event.constructor as new (
        type: string,
        init?: object
    ) => Event;

    return event.type === 'submit'
        ? new EventInterface(event.type, {
              bubbles: event.bubbles,
              cancelable: event.cancelable,
              composed: event.composed
          })
        : new EventInterface(event.type, event);
};

/**
 * Starts capturing the given event types on a hydrating root for the settle
 * window: one capturing listener per type, scoped to the root. Recorded
 * events have their native action cancelled — except clicks with an
 * enclosing `href`-bearing anchor, which pass through untouched (and
 * unrecorded) so native navigation keeps degrading gracefully.
 */
export const captureReplayEvents = (
    root: Element,
    replayEvents: true | string[]
): ReplaySession => {
    const eventTypes =
        replayEvents === true ? DEFAULT_REPLAY_TYPES : replayEvents;
    const queue: RecordedEvent[] = [];

    const record = (event: Event) => {
        const path = indexPathTo(root, event.target);

        if (path === null) {
            return;
        }

        if (
            event.type === 'click' &&
            (event.target as Element).closest('a[href]')
        ) {
            return;
        }

        // Cancel the native action being replaced — a mid-boot full-page
        // form post is the exact loss being solved.
        (event.type === 'click' || event.type === 'submit') &&
            event.preventDefault();

        if (queue.length >= QUEUE_CAP) {
            const dropped = queue.shift();

            loomConsole.warn(
                `[loom] hydrate: replay queue is full (${QUEUE_CAP}) — dropped the oldest recorded '${dropped?.event.type}' event.`
            );
        }

        queue.push({ event, path });
    };

    for (const eventType of eventTypes) {
        root.addEventListener(eventType, record, true);
    }

    const stop = () => {
        for (const eventType of eventTypes) {
            root.removeEventListener(eventType, record, true);
        }
    };

    return {
        replay() {
            stop();

            for (const { event, path } of queue.splice(0)) {
                const target = resolveIndexPath(root, path);

                if (!target) {
                    loomConsole.warn(
                        `[loom] hydrate: replay dropped a '${event.type}' event — target path [${path.join(', ')}] did not resolve in the hydrated tree.`
                    );
                    continue;
                }

                target.dispatchEvent(rebuildEvent(event));
            }
        },
        stop
    };
};
