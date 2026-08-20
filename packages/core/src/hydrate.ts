import { bootstrap, configApp, resolveAppRoot } from './lib/bootstrap';
import { _lifeCycles } from './lib/context/life-cycles';
import { getDocument } from './lib/dom';
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
 * placeholders mid-boot. See `init` for the immediate-mount boot.
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
    root = getDocument().body
}: AppHydrateProps): Promise<void> => {
    bootstrap();
    // First configure the app.
    configApp(globalConfig);

    // The off-DOM render — the render path never needs attachment; `mount` is
    // the only DOM-touching step, deferred below.
    const appCtx = app();
    const appRoot = resolveAppRoot(root);

    // Effect updates landing pre-swap must see this detached tree as a live
    // instance, not a stale one (D7). Captured so the removal below releases
    // exactly what was registered.
    const detachedAppRoot = appCtx.root;

    addHydratingRoot(detachedAppRoot);

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
        removeHydratingRoot(detachedAppRoot);
    }
    // Observe DOM changes for some component life-cycle events — the sweep
    // also fires `onMounted` for the now-attached tree.
    _lifeCycles.observe(appRoot);

    // Execute the app-fully-mounted callback.
    if (typeof onAppMounted === 'function') {
        onAppMounted(appRoot);
    }
};
