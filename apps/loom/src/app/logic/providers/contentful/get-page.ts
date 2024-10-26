import { contentfulRequest } from './lib/contentful-request';
import {
    shortPageFields,
    shortContentFields,
    baseContentFields,
    basePageFields
} from './lib/fragments';
import { pageBySlug } from './lib/queries';
import { PageSummary } from './lib/types';
import { createQuery } from '@loom-js/utils';
import { ContentfulCollection } from 'contentful';

const previewArg = '$isPreview: Boolean = true';
const slugArg = '$slug: String!';

export const getPageBySlug = async (slug = '') =>
    await contentfulRequest<
        PageSummary,
        { pageCollection: ContentfulCollection<PageSummary> }
    >({
        adapter: ({ data }) => {
            return data?.pageCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, slugArg],
            fragments: [baseContentFields, basePageFields, shortPageFields],
            queries: [pageBySlug],
            queryLabel: 'PageBySlug'
        }),
        variables: {
            isPreview: __CTF_IS_PREVIEW__ ?? true,
            slug
        }
    });
