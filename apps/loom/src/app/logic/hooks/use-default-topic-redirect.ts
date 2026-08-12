import { redirect, watchRoute } from '@loom-js/core';

/**
 * Redirects to the default topic when the current route has no topic param.
 * @param defaultTopic The href to redirect to.
 * @param whenRoute Scopes the redirect to a matched route — without it the
 *      watcher would fire on every route, redirecting any topic-less page
 *      (e.g. the home page) into the docs section.
 */
export const useDefaultTopicRedirect = (defaultTopic = '', whenRoute = '') => {
    watchRoute(async ({ value: routeValue }) => {
        if (whenRoute && routeValue.matchedRoute !== whenRoute) {
            return;
        }

        if (!routeValue.params.topic && defaultTopic) {
            redirect(defaultTopic);
        }
    });
};
