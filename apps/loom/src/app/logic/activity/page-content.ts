import { activity, resource } from '@loom-js/core';

import { page, topic } from './selected-content';
import { getPageContent } from '@/app/logic/providers/contentful';
import type {
    ContentLoadFailure,
    PageContent
} from '@/app/logic/providers/contentful/lib/types';

export interface PageContentRequest {
    pageSlug: string;
    topicSlug: string;
}

const hasContentError = (
    value: object | undefined
): value is ContentLoadFailure => !!value && 'contentError' in value;

// Throwing on a failed load keeps the failure out of the resource cache —
// `resource` doesn't cache rejections, so the next navigation retries.
const fetchPageContent = async (
    pageSlug: string,
    topicSlug: string
): Promise<PageContent> => {
    const { data, error } = await getPageContent(pageSlug, topicSlug);

    if (error || !data) {
        throw new Error(error || 'The content request failed.');
    }

    return data;
};

/**
 * The docs content pipeline: `update({ pageSlug, topicSlug })` loads the page
 * listing + topic body through core's keyed resource cache and fans the
 * result out to the `page` and `topic` activities. Running the load inside an
 * activity transform keeps it on the settlement signal (server renders and
 * hydration swaps wait for it), and the stable `page-content:` key makes the
 * values capturable by `dehydrate()` and primeable on the client.
 */
// Keys this window has successfully loaded — mirrors the resource cache
// (which core doesn't expose a peek for) so the skeleton reset above only
// fires when a real fetch is coming.
const loadedKeys = new Set<string>();

/**
 * Builds the resource-cache key for one page + topic load — the same key
 * `dehydrate` captures and the prerender pass validates.
 */
export const pageContentResourceKey = (pageSlug: string, topicSlug: string) =>
    `page-content:${pageSlug}:${topicSlug}`;

export const pageContent = activity<
    PageContent | ContentLoadFailure | undefined,
    PageContentRequest
>(undefined, async ({ input: { pageSlug, topicSlug }, signal, update }) => {
    // Navigating to a topic this window hasn't loaded yet clears the held
    // one immediately, so the skeleton renders for the whole load instead of
    // the previous topic sitting frozen until the swap. Already-loaded
    // topics resolve from the resource cache and swap in place in a single
    // render — measured at 8-86ms on production (2026-09-09), so no skeleton
    // flash is warranted for them.
    const resourceKey = pageContentResourceKey(pageSlug, topicSlug);
    const heldTopic = topic.value();
    const topicChanged =
        hasContentError(heldTopic) || heldTopic?.slug !== topicSlug;

    if (topicChanged && !loadedKeys.has(resourceKey)) {
        topic.update(undefined);
    }

    try {
        const data = await resource(resourceKey, () =>
            fetchPageContent(pageSlug, topicSlug)
        );

        loadedKeys.add(resourceKey);

        // A newer navigation superseded this run — don't write to `page`/
        // `topic`; the latest dispatch owns the paint.
        if (signal.aborted) {
            return;
        }

        // Only update `page` when the page itself changed, so topic
        // navigations don't re-render the nav with an identical object.
        const currentPage = page.value();
        const currentPageSlug = !hasContentError(currentPage)
            ? currentPage?.slug
            : undefined;

        if (data.page && data.page.slug !== currentPageSlug) {
            page.update(data.page);
        }

        if (data.topic) {
            topic.update(data.topic);
        }

        update(data);
    } catch (loadError) {
        // Same guard on the failure path — a superseded run's error is moot.
        if (signal.aborted) {
            return;
        }

        const failure: ContentLoadFailure = {
            contentError:
                loadError instanceof Error
                    ? loadError.message
                    : 'The content request failed.'
        };

        // Keep an already-rendered side nav; only an empty one shows failure.
        if (!page.value()) {
            page.update(failure);
        }

        topic.update(failure);
        update(failure);
    }
});
