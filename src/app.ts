import { ContextFunction } from './types';

export interface AppInitProps {
    app: ContextFunction;
    onAppMounted: (mountedApp: Node) => any;
    root: HTMLElement;
}

export const init = ({ app, onAppMounted, root }: AppInitProps) => {
    const mountedApp = root.appendChild(app());

    if (typeof onAppMounted === 'function') {
        onAppMounted(mountedApp);
    }
};
