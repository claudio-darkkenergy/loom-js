import { appendEvents, setDebug, setToken } from './config';
import { _lifeCycles } from './lib/context/life-cycles';
import { getDocument, getWindow } from './lib/dom';
import { loomConsole } from './lib/globals/loom-console';
import { mount } from './lib/mount';
import type { AppGlobalConfig, AppInitProps, LoomGlobal } from './types';

export const init = ({
    app,
    append = null,
    globalConfig = {},
    onAppMounted,
    root = getDocument().body
}: AppInitProps) => {
    bootstrap();
    // First configure the app.
    configApp(globalConfig);

    const appCtx = app();
    const { HTMLBodyElement, HTMLHeadElement } = getWindow();

    if (
        root === null ||
        root instanceof HTMLHeadElement ||
        root instanceof HTMLBodyElement
    ) {
        // `root` cannot be the document HEAD or BODY.
        root = getDocument().createElement('div');
        root.id = 'loom-app';

        // Mount the detatched root to the document body.
        mount(undefined, root, false);
    }

    mount(root, appCtx, append);
    // Observe DOM changes for some component life-cycle events.
    _lifeCycles.observe(root);

    // Execute the app-fully-mounted callback.
    if (typeof onAppMounted === 'function') {
        // The app has fully mounted, including all component descendants.
        // @TODO `root` should not be passed as an argument every time. It may be the `appCtx.root`
        // depending on how the app is configured.
        onAppMounted(root);
    }
};

const bootstrap = () => {
    ((globalThis as any).loom as LoomGlobal) = {
        console: loomConsole
    };
};

const configApp = ({ debug, debugScope, events, token }: AppGlobalConfig) => {
    debug !== undefined && setDebug(debug, debugScope);
    events && appendEvents(events);
    token && setToken(token);
};
