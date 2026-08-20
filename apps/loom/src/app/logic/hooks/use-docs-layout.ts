import { watchRoute } from '@loom-js/core';

import { useDefaultTopicRedirect } from './use-default-topic-redirect';
import { usePageContent } from './use-page-content';
import { useSideNavToggle } from './use-side-nav-toggle';
import { useTopicTocToggle } from './use-topic-toc-toggle';
import { RoutePath, ScreenWidthPx } from '@/app/pages/constants';

// Docs setup registers global listeners/watchers, and loom has no reactive
// teardown — so it must run exactly once per app lifetime, no matter how many
// times the docs layout mounts.
let isDocsLayoutSetup = false;

// The single page that backs the docs side nav.
const docsPageSlug = '/docs';

/**
 * Performs the docs-section setup — toggle wiring, default-topic redirect,
 * page fetch, and topic route watcher — exactly once per app lifetime.
 * `DocsLayout` calls this and renders; repeat calls are no-ops.
 */
export const useDocsLayout = () => {
    if (isDocsLayoutSetup) {
        return;
    }

    isDocsLayoutSetup = true;

    useSideNavToggle(`(width >= ${ScreenWidthPx.TabletStart}px)`);
    useTopicTocToggle(`(width >= ${ScreenWidthPx.DesktopStart}px)`);
    useDefaultTopicRedirect('/docs/get-started', RoutePath.Docs);
    // Page + topic data — one request per docs navigation, scoped to the
    // docs route so navigation elsewhere never triggers a content fetch.
    watchRoute(({ value: routeValue }) => {
        if (routeValue.matchedRoute === RoutePath.Docs) {
            usePageContent(docsPageSlug, routeValue.params.topic);
        }
    });
};
