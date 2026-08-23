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
export const pageContent = activity<
    PageContent | ContentLoadFailure | undefined,
    PageContentRequest
>(undefined, async ({ input: { pageSlug, topicSlug }, update }) => {
    try {
        const data = await resource(
            `page-content:${pageSlug}:${topicSlug}`,
            () => fetchPageContent(pageSlug, topicSlug)
        );
        // A page's listing only changes when the page itself changes — update
        // on a slug change (or to replace an empty/failed state) so topic
        // navigations within a page don't re-render the nav with a
        // fresh-but-identical object.
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
