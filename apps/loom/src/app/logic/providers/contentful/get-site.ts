import { contentfulRequest } from './lib/contentful-request';
import { siteCollection } from './lib/queries';
import { Site } from './lib/types';
import { createQuery } from '@loom-js/utils';
import { ContentfulCollection } from 'contentful';

const previewArg = '$isPreview: Boolean = true';
const siteIdArg = '$siteId: String!';

export const getSite = async (siteId: string) =>
    await contentfulRequest<
        Site,
        { siteCollection: ContentfulCollection<Site> }
    >({
        adapter: ({ data }) => {
            return data?.siteCollection.items[0];
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
