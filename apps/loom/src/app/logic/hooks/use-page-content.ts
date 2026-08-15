import { page, topic } from '../activity/selected-content';
import { getPageContent } from '@/app/logic/providers/contentful';
import { ContentLoadFailure } from '@/app/logic/providers/contentful/lib/types';

const hasContentError = (
    value: object | undefined
): value is ContentLoadFailure => !!value && 'contentError' in value;

/**
 * Fetches a page's listing (side nav) and the selected topic body in one
 * request, fanning the result out to the `page` and `topic` activities.
 * On failure the activities carry a `ContentLoadFailure` so views render an
 * error state rather than an indefinite skeleton.
 */
export const usePageContent = async (pageSlug: string, topicSlug = '') => {
    if (!pageSlug || !topicSlug) {
        return;
    }

    const { data, error } = await getPageContent(pageSlug, topicSlug);

    if (error || !data) {
        // Keep an already-rendered side nav; only an empty one shows failure.
        if (!page.value()) {
            page.update({
                contentError: error || 'The content request failed.'
            });
        }

        topic.update({ contentError: error || 'The content request failed.' });
        return;
    }

    // A page's listing only changes when the page itself changes — update on
    // a slug change (or to replace an empty/failed state) so topic
    // navigations within a page don't re-render the nav with a
    // fresh-but-identical object.
    const currentPage = page.value();
    const currentPageSlug =
        currentPage && !hasContentError(currentPage)
            ? currentPage.slug
            : undefined;

    if (data.page && data.page.slug !== currentPageSlug) {
        page.update(data.page);
    }

    if (data.topic) {
        topic.update(data.topic);
    }
};
