import { ContentfulCollection } from 'contentful';

import {
    contentFields,
    pageContentBySlug,
    pageFields,
    siteCollection
} from '@app/graphql/contentful';
import {
    pageContentGraphQlUrl,
    siteContentGraphQlUrl
} from '@app/helpers/api/urls';
import { contentfulRequest } from '@app/helpers/contentful/contentful-request';
import { createQuery } from '@app/helpers/graphql/query';
import { Page, Site } from '@app/types';

const previewArg = '$isPreview: Boolean = true';
const siteIdArg = '$siteId: String!';
const slugArg = '$slug: String!';

export const getPage = async (slug = '') =>
    await contentfulRequest<
        { pageCollection: ContentfulCollection<Page> },
        Page | undefined
    >({
        adapter: ({ data }) => {
            console.log('contentful page data', data);
            return data?.pageCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, slugArg],
            fragments: [contentFields, pageFields],
            queries: [pageContentBySlug]
        }),
        url: pageContentGraphQlUrl,
        variables: {
            isPreview: true,
            slug
        }
    });

export const getSite = async (siteId: string) =>
    await contentfulRequest<
        { siteCollection: ContentfulCollection<Site> },
        Site | undefined
    >({
        adapter: ({ data }) => {
            console.log('contentful site data', data);
            return data?.siteCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, siteIdArg],
            queries: [siteCollection]
        }),
        url: siteContentGraphQlUrl,
        variables: {
            isPreview: true,
            siteId
        }
    });
