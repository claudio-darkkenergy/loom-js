import { USE_MOCKS } from '@app/constants';

export const contentfulGraphQlUrl = USE_MOCKS
    ? '/mocks/contentful/page.json'
    : `/api/edge/contentful/graphql`;
