import { ContentfulCollection } from 'contentful';

import {
    contentFields,
    pageContentBySlug,
    pageFields,
    siteCollection
} from '@app/graphql/contentful';
import { contentfulRequest } from '@app/helpers/contentful/contentful-request';
import { createQuery } from '@app/helpers/graphql/query';
import { Page, Site } from '@app/types';

const previewArg = '$isPreview: Boolean = true';
const siteIdArg = '$siteId: String!';
const slugArg = '$slug: String!';

export const getPage = async (slug = '') =>
    await contentfulRequest<
        Page,
        { pageCollection: ContentfulCollection<Page> }
    >({
        adapter: ({ data }) => {
            console.log('contentful page data', data);
            return data.pageCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, slugArg],
            fragments: [contentFields, pageFields],
            queries: [pageContentBySlug]
        }),
        variables: {
            isPreview: true,
            slug
        }
    });

export const getSite = async (siteId: string) =>
    await contentfulRequest<
        Site,
        { siteCollection: ContentfulCollection<Site> }
    >({
        adapter: ({ data }) => {
            console.log('contentful site data', data);
            return data.siteCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, siteIdArg],
            queries: [siteCollection]
        }),
        variables: {
            isPreview: true,
            siteId
        }
    });
