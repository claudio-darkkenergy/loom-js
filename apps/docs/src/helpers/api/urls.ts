import { USE_MOCKS } from '@app/constants';

export const contentfulGraphQlUrl = '/api/edge/contentful/graphql';

export const siteContentGraphQlUrl = USE_MOCKS
    ? '/mocks/contentful/site-content.json'
    : contentfulGraphQlUrl;

export const pageContentGraphQlUrl = USE_MOCKS
    ? '/mocks/contentful/page-content.json'
    : contentfulGraphQlUrl;
