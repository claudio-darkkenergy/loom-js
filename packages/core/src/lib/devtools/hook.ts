import type { ComponentContextPartial } from '../../types';
import type { InspectableActivity } from './activity-ref';

/**
 * What core reports to a running devtools backend. Structure is read on
 * demand from the live tree; only these moments are pushed.
 */
export interface DevtoolsHook {
    // An activity was created — reaches activities no rendered tree holds.
    activityCreated(activity: InspectableActivity): void;
    // A component instance or activity boundary rendered; `ms` spans the
    // render including its descendants.
    rendered(ctx: ComponentContextPartial, ms: number): void;
}

// `null` until a backend installs itself: every hot-path site is a single
// null check while devtools is off.
export let devtoolsHook: DevtoolsHook | null = null;

/**
 * Installs (or, with `null`, removes) the devtools hook.
 * @param hook The backend's hook.
 */
export const setDevtoolsHook = (hook: DevtoolsHook | null) => {
    buffered = [];
    devtoolsHook = hook;
};

// Events recorded between `enable()` and the backend's arrival — the
// window a persisted enable opens before the app's first render.
type BufferedEvent =
    | ['activityCreated', InspectableActivity]
    | ['rendered', ComponentContextPartial, number];

const BUFFER_CAP = 10_000;
let buffered: BufferedEvent[] = [];
const bufferingHook: DevtoolsHook = {
    activityCreated: (activity) =>
        buffered.length < BUFFER_CAP &&
        buffered.push(['activityCreated', activity]),
    rendered: (ctx, ms) =>
        buffered.length < BUFFER_CAP && buffered.push(['rendered', ctx, ms])
};

/** Records hook events until a backend takes them (`takeBufferedEvents`). */
export const startBuffering = () => {
    devtoolsHook ??= bufferingHook;
};

/**
 * Hands the events recorded since `startBuffering` to a backend's hook and
 * stops buffering.
 * @param hook The hook to replay the events into.
 */
export const takeBufferedEvents = (hook: DevtoolsHook) => {
    const events = buffered;

    buffered = [];
    devtoolsHook === bufferingHook && (devtoolsHook = null);
    events.forEach((event) =>
        event[0] === 'rendered'
            ? hook.rendered(event[1], event[2])
            : hook.activityCreated(event[1])
    );
};

/** The high-resolution clock render timings use. */
export const now = () => globalThis.performance.now();
