import { ContentProps } from '@loom-js/contentful';
import { createQuery } from '@loom-js/utils';
import { ContentfulCollection } from 'contentful';

import { contentfulRequest } from './lib/contentful-request';
import {
    baseContentFields,
    basePageFields,
    contentFields,
    shortPageFields
} from './lib/fragments';
import { pageContentBySlugs, previewArg } from './lib/queries';
import { PageContent, PageSummary } from './lib/types';

const pageSlugArg = '$pageSlug: String!';
const topicSlugArg = '$topicSlug: String!';

export const getPageContent = async (pageSlug: string, topicSlug: string) =>
    await contentfulRequest<
        PageContent,
        {
            contentCollection: ContentfulCollection<ContentProps>;
            pageCollection: ContentfulCollection<PageSummary>;
        }
    >({
        adapter: ({ data, errors }) => {
            const page = data?.pageCollection.items[0];
            const topic = data?.contentCollection.items[0];

            // A GraphQL error with nothing usable is a failed load — throwing
            // turns it into an uncached error result instead of a 200 the
            // views would mistake for "still loading".
            if (!page && !topic && errors?.length) {
                throw new Error(
                    errors[0]?.message || 'The content request failed.'
                );
            }

            return { page, topic };
        },
        query: createQuery({
            args: [previewArg, pageSlugArg, topicSlugArg],
            fragments: [
                baseContentFields,
                basePageFields,
                contentFields,
                shortPageFields
            ],
            queries: [pageContentBySlugs],
            queryLabel: 'PageContentBySlugs'
        }),
        variables: {
            isPreview: __CTF_IS_PREVIEW__,
            pageSlug,
            topicSlug
        }
    });
