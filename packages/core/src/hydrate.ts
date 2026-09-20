import { bootstrap, configApp, resolveAppRoot } from './lib/bootstrap';
import { _lifeCycles } from './lib/context/life-cycles';
import { getDocument } from './lib/dom';
import { captureReplayEvents } from './lib/event-replay';
import { loomConsole } from './lib/globals/loom-console';
import { addHydratingRoot, removeHydratingRoot } from './lib/hydrating-roots';
import { mount } from './lib/mount';
import { boundedWait, getPendingCount } from './lib/settlement';
import { settled } from './settled';
import type { AppHydrateProps } from './types';

/**
 * The hydrating client boot for pre-rendered pages: the root's server-rendered
 * children stay visible and untouched while the app renders off-DOM, and the
 * takeover is a single atomic swap once the app has settled — lazy route
 * content and async activity work included — so nothing regresses to
 * placeholders mid-boot. An empty root (no served markup) skips the gate
 * and mounts immediately, rendering progressively exactly as `init` would.
 *
 * Pre-swap, the server DOM has no listeners: native anchors still navigate
 * (full page load); other interaction is inert for the short, bounded settle
 * window.
 */
export const hydrate = async ({
    app,
    globalConfig = {},
    maxWait = 4000,
    onAppMounted,
    ready,
    replayEvents,
    root = getDocument().body
}: AppHydrateProps): Promise<void> => {
    bootstrap();
    // First configure the app.
    configApp(globalConfig);

    // The off-DOM render — the render path never needs attachment; `mount` is
    // the only DOM-touching step, deferred below.
    const appCtx = app();
    const appRoot = resolveAppRoot(root);

    // An empty root has nothing to preserve, so the settle gate would only
    // hold a blank screen — mount immediately and render progressively,
    // leaving any fragment scroll to the router's settle-gated pass.
    if (!appRoot.firstElementChild) {
        mount(appRoot, appCtx);
        _lifeCycles.observe(appRoot);

        if (typeof onAppMounted === 'function') {
            onAppMounted(appRoot);
        }

        return;
    }

    // Effect updates landing pre-swap must see this detached tree as a live
    // instance, not a stale one (D7). Captured so the removal below releases
    // exactly what was registered.
    const detachedAppRoot = appCtx.root;

    addHydratingRoot(detachedAppRoot);

    // Opt-in event replay: capture settle-window interactions on the served
    // markup for ordered re-dispatch after the swap.
    const replaySession = replayEvents
        ? captureReplayEvents(appRoot, replayEvents)
        : undefined;

    try {
        const settleGate = ready ? Promise.all([settled(), ready]) : settled();
        const expired = await boundedWait(settleGate, maxWait);

        // A wedged settle must not silently boot a broken page — swap anyway,
        // but say so.
        expired &&
            loomConsole.warn(
                `[loom] hydrate: settlement did not complete within ${maxWait}ms — swapping with ${getPendingCount()} operation(s) still pending. Pass \`maxWait: Infinity\` to disable the bound.`
            );

        // The single atomic swap.
        mount(appRoot, appCtx);
    } finally {
        // Capture ends at the swap — and on the failure path, so nothing
        // outlives the boot.
        replaySession?.stop();
        removeHydratingRoot(detachedAppRoot);
    }
    // Observe DOM changes for some component life-cycle events — the sweep
    // also fires `onMounted` for the now-attached tree.
    _lifeCycles.observe(appRoot);

    // Recorded interactions land after the lifecycle sweep — handlers see a
    // mounted, observed tree — and before the app-mounted callback.
    replaySession?.replay();

    // Execute the app-fully-mounted callback.
    if (typeof onAppMounted === 'function') {
        onAppMounted(appRoot);
    }
};
