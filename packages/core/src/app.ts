import { _lifeCycles } from './lib/context/life-cycles';
import { mount } from './lib/mount';
import { AppInitProps } from './types';

export const init = ({
    app,
    append = null,
    onAppMounted,
    root = document.body
}: AppInitProps) => {
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
