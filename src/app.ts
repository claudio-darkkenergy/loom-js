import { lifeCycles } from './life-cycles';
import { AppInitProps } from './types';

export const init = ({
    app,
    append = null,
    onAppMounted,
    root = document.body
}: AppInitProps) => {
    const mountedApp = (typeof app === 'function' ? app() : app) as Node;

    if (append === null) {
        // Ensure the root element is empty.
        root.innerHTML = '';
    }

    if (append === false) {
        // Prepend the root element.
        root.insertBefore(mountedApp, root.firstChild);
    } else {
        // Append the root element.
        root.appendChild(mountedApp);
    }

    // First handle the app-mounted callback.
    if (typeof onAppMounted === 'function') {
        onAppMounted(mountedApp);
    }

    // Observe DOM changes for some component life-cycle events.
    lifeCycles.observe(mountedApp);
};
