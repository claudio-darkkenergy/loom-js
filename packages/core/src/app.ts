import { lifeCycles } from './life-cycles';
import { AppInitProps } from './types';

export const init = ({
    app,
    append = null,
    onAppMounted,
    root = document.body
}: AppInitProps) => {
    const mountedApp = (typeof app === 'function' ? app() : app) as Node;
    const appNodes =
        mountedApp instanceof NodeList ? Array.from(mountedApp) : [mountedApp];

    if (append === null) {
        // Ensure the root element is empty.
        // root.innerHTML = '';
        root.replaceChildren(...appNodes);
    } else if (append === false) {
        // Prepend the root element.
        root.prepend(...appNodes);
    } else {
        // Append the root element.
        root.append(...appNodes);
    }

    // First handle the app-mounted callback.
    if (typeof onAppMounted === 'function') {
        onAppMounted(appNodes);
    }

    // Observe DOM changes for some component life-cycle events.
    lifeCycles.observe(mountedApp);
};
