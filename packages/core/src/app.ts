import { bootstrap, configApp, resolveAppRoot } from './lib/bootstrap';
import { _lifeCycles } from './lib/context/life-cycles';
import { getDocument } from './lib/dom';
import { mount } from './lib/mount';
import type { AppInitProps } from './types';

export const init = ({
    app,
    globalConfig = {},
    onAppMounted,
    placement,
    root = getDocument().body
}: AppInitProps) => {
    bootstrap();
    // First configure the app.
    configApp(globalConfig);

    const appCtx = app();
    const appRoot = resolveAppRoot(root);

    mount(appRoot, appCtx, placement);
    // Observe DOM changes for some component life-cycle events.
    _lifeCycles.observe(appRoot);

    // Execute the app-fully-mounted callback.
    if (typeof onAppMounted === 'function') {
        // The app has fully mounted, including all component descendants.
        // @TODO `root` should not be passed as an argument every time. It may be the `appCtx.root`
        // depending on how the app is configured.
        onAppMounted(appRoot);
    }
};
