import { router, sanitizeLocation } from '@loom-js/core';

import { pageContentActivity } from '@app/activities/page-content';
import { Home } from '@app/component/container/pages/home';
import { Page } from '@app/component/container/pages/page';
import { Site } from '@app/types';

export interface AppRoutesProps {
    site: Partial<Site>;
}

export const AppRoutes = ({ site }: AppRoutesProps) => {
    const { reset: resetPageContent, update: updatePageContent } =
        pageContentActivity;

    return router(({ value: location }) => {
        const { pathname } = sanitizeLocation(location);
        const learnRouteRe = /^\/learn(?:\/(\w+[\w|-]*))?(?:\/(\w+[\w|-]*))?$/;

        // Routes
        switch (true) {
            case '/' === pathname:
                // Home
                console.group('router:page:home');
                resetPageContent();
                updatePageContent(pathname);

                return Home({ site });
            case learnRouteRe.test(pathname):
                // Learn
                resetPageContent();
                updatePageContent(pathname);

                return Page({ site });
            default:
                // 404 Page
                // @TODO This should load a 404 page component - it's currently loading the homepage.
                resetPageContent();
                updatePageContent(pathname);

                return Home({ site });
        }
    });
};
