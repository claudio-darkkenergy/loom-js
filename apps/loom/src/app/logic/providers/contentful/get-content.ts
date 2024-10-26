import { contentfulRequest } from './lib/contentful-request';
import { baseContentFields, contentFields } from './lib/fragments';
import { contentById, contentBySlug } from './lib/queries';
import { ContentProps } from '@loom-js/contentful';
import { createQuery } from '@loom-js/utils';
import { ContentfulCollection } from 'contentful';

const previewArg = '$isPreview: Boolean = true';
const idArg = '$id: String!';
const slugArg = '$slug: String!';

export const getContentById = async (id = '') =>
    await contentfulRequest<ContentProps>({
        query: createQuery({
            args: [previewArg, idArg],
            fragments: [contentFields],
            queries: [contentById]
        }),
        variables: {
            isPreview: __CTF_IS_PREVIEW__ ?? true,
            id
        }
    });

export const getContentBySlug = async (slug = '') =>
    await contentfulRequest<
        ContentProps,
        { contentCollection: ContentfulCollection<ContentProps> }
    >({
        adapter: ({ data }) => {
            return data?.contentCollection.items[0];
        },
        query: createQuery({
            args: [previewArg, slugArg],
            fragments: [baseContentFields, contentFields],
            queries: [contentBySlug]
        }),
        variables: {
            isPreview: __CTF_IS_PREVIEW__ ?? true,
            slug
        }
    });
