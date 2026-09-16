import { type Unsubscriber, watchRoute } from '@loom-js/core';

import { useDefaultTopicRedirect } from './use-default-topic-redirect';
import { usePageContent } from './use-page-content';
import { useSideNavToggle } from './use-side-nav-toggle';
import { useTopicTocToggle } from './use-topic-toc-toggle';
import {
    DOCS_PAGE_SLUG,
    RoutePath,
    ScreenWidthPx
} from '@/app/pages/constants';

/**
 * Performs the docs-section setup: toggle wiring, default-topic redirect,
 * and the topic route watcher that fetches page content. Runs per layout
 * mount and tears down through `onUnmounted`, so watchers never stack
 * across re-mounts and every prerender window gets its own setup.
 * @param onUnmounted The calling component's unmount hook.
 */
export const useDocsLayout = (onUnmounted?: (teardown: () => void) => void) => {
    useSideNavToggle(`(width >= ${ScreenWidthPx.TabletStart}px)`);
    useTopicTocToggle(`(width >= ${ScreenWidthPx.DesktopStart}px)`);

    const teardowns: Unsubscriber[] = [
        useDefaultTopicRedirect('/docs/getting-started', RoutePath.Docs),
        // Page + topic data: one request per docs navigation, and only on
        // the docs route.
        watchRoute(({ value: routeValue }) => {
            if (routeValue.matchedRoute === RoutePath.Docs) {
                usePageContent(DOCS_PAGE_SLUG, routeValue.params.topic);
            }
        })
    ];

    onUnmounted?.(() => teardowns.forEach((unsubscribe) => unsubscribe()));
};
