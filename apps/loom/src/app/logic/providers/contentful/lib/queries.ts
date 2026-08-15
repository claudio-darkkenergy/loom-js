// The document-level default tracks the build-time preview flag, so a query
// that omits the `isPreview` variable still follows the build's
// delivery/preview mode instead of silently diverging from it.
export const previewArg = `$isPreview: Boolean = ${__CTF_IS_PREVIEW__}`;

// A page's listing (side nav) and topic body share one document so a page
// navigation costs a single request.
export const pageContentBySlugs = `
    pageCollection(limit: 1, preview: $isPreview, where: { slug: $pageSlug }) {
        items {
            ...shortPageFields
        }
    }
    contentCollection(limit: 1, preview: $isPreview, where: { slug: $topicSlug }) {
        items {
            ...contentFields
        }
    }
`;

export const siteCollection = `
    siteCollection(limit: 1, preview: $isPreview, where: {
        title: $siteId
    }) {
        items {
            title
            seoDescription
            shortDescription
            logo {
                description
                height
                title
                url
                width
            }
            pagesCollection(limit: 5) {
                items {
                    title
                    slug
                }
            }
        }
    }
`;
