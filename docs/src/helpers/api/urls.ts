export const contentfulGraphQlUrl = JSON.parse(process.env.USE_MOCKS)
    ? '/mocks/contentful/page.json'
    : `/api/edge/contentful/graphql`;
