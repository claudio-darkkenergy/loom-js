import { appendEvents, setDebug, setToken } from './config';
import { _lifeCycles } from './lib/context/life-cycles';
import { loomConsole } from './lib/globals/loom-console';
import { mount } from './lib/mount';
import { AppGlobalConfig, AppInitProps } from './types';

export const init = ({
    app,
    append = null,
    globalConfig = {},
    onAppMounted,
    root = document.body
}: AppInitProps) => {
    bootstrap();
    // First configure the app.
    configApp(globalConfig);

    const appCtx = app();

    if (
        root === null ||
        root instanceof HTMLHeadElement ||
        root instanceof HTMLBodyElement
    ) {
        // `root` cannot be the document HEAD or BODY.
        root = document.createElement('div');
        root.id = 'loom-app';
    }

    mount(root, appCtx, append);
    // Observe DOM changes for some component life-cycle events.
    _lifeCycles.observe(root);

    // Execute the app-fully-mounted callback.
    if (typeof onAppMounted === 'function') {
        // The app has fully mounted, including all component descendants.
        onAppMounted(root);
    }
};

const bootstrap = () => {
    globalThis.loom = {
        console: loomConsole
    };
};

const configApp = ({ debug, debugScope, events, token }: AppGlobalConfig) => {
    debug !== undefined && setDebug(debug, debugScope);
    events && appendEvents(events);
    token && setToken(token);
};
