import {
    Component,
    ComponentNodeAsync,
    router,
    sanitizeLocation,
    SimpleComponent
} from '@loom-js/core';

import { pageContentActivity } from '@app/activities/page-content';
import { Site } from '@app/types';

export interface AppRoutesProps {
    site: Partial<Site>;
}

// Lazy-loadable pages for the router.
const LazyHome = () =>
    import(
        /* webpackChunkName: "home" */ '@app/component/container/pages/home'
    );
const LazyPage = () =>
    import(
        /* webpackChunkName: "page" */ '@app/component/container/pages/page'
    );

export const AppRoutes = ({ site }: AppRoutesProps) => {
    const { reset: resetPageContent, update: updatePageContent } =
        pageContentActivity;

    return router(({ value: location }) => {
        const { pathname } = sanitizeLocation(location);
        const learnRouteRe = /^\/learn(?:\/(\w+[\w|-]*))?(?:\/(\w+[\w|-]*))?$/;
        const getLazyPage =
            <D extends {}, T extends string>({
                importName,
                importProps,
                lazyImport
            }: {
                importName: T;
                importProps: D;
                lazyImport: () => Promise<{
                    [P in T]: Component<D> | SimpleComponent<D>;
                }>;
            }): ComponentNodeAsync =>
            async () => {
                resetPageContent();
                const lazyPage = await lazyImport();
                updatePageContent(pathname);
                console.log('lazy page', lazyPage);

                return lazyPage[importName](importProps);
            };

        // Routes
        switch (true) {
            case '/' === pathname:
                // Home
                console.group('router:page:home');
                // return getLazyPage<HomeProps, { Home: Component<HomeProps> }>({
                return getLazyPage({
                    importName: 'Home',
                    importProps: {
                        site
                    },
                    lazyImport: LazyHome
                });
            case learnRouteRe.test(pathname):
                // Learn
                return getLazyPage({
                    importName: 'Page',
                    importProps: {
                        site
                    },
                    lazyImport: LazyPage
                });
            default:
                // 404 Page
                // @TODO This should load a 404 page component - it's currently loading the homepage.
                return getLazyPage({
                    importName: 'Home',
                    importProps: {
                        site
                    },
                    lazyImport: LazyHome
                });
        }
    });
};
