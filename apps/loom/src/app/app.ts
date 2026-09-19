import { type ContextFunction, createRoutes, simple } from '@loom-js/core';
import { usePinkTheming } from '@loom-js/pink';

import { RoutePath } from './pages/constants';
import PageLayout from './pages/layout';

// The build manifest keys by shell scope; the router keys by pattern —
// bridge the two here, where both vocabularies are owned.
const manifest =
    typeof window === 'undefined' ? undefined : window.__ROUTE_ASSETS__;

const Routes = createRoutes({
    assets: manifest && {
        [RoutePath.Home]: manifest['/'] ?? [],
        [RoutePath.Docs]: manifest['/docs'] ?? []
    },
    config: {
        [RoutePath.Home]: () => import('@/app/pages/'),
        [RoutePath.Docs]: () => import('@/app/pages/docs/')
    }
});

const AppShell = simple(({ className, style, ...props }) =>
    PageLayout({
        children: Routes(props),
        className,
        style
    })
);

/**
 * The composed app. The browser boot and the prerender pass both call this
 * one factory, so the served markup and the hydrating client render the
 * same tree.
 */
export const App = (): ContextFunction => {
    // Compose inside the returned function, not at `App()` time: `Routes`
    // needs the current window, which `renderToString` installs only once
    // the render runs.
    return (ctx) => {
        const appShell = AppShell({
            style: usePinkTheming({
                headingFont: 'Pelinka-ExtraBold',
                contentFont: 'Pelinka-Regular'
            }).style
        }) as ContextFunction;

        return appShell(ctx);
    };
};
