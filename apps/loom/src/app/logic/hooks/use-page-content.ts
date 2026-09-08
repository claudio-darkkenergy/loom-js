import { pageContent } from '../activity/page-content';

/**
 * Drives the docs content pipeline for a navigation. The fetch itself lives
 * in the `pageContent` activity transform — routed through the resource
 * cache and tracked by the settlement signal — so this hook only validates
 * and dispatches.
 */
export const usePageContent = (pageSlug: string, topicSlug = '') => {
    if (!pageSlug || !topicSlug) {
        return;
    }

    pageContent.update({ pageSlug, topicSlug });
};
