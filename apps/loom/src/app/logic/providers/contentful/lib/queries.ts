export const contentById = `
    content(preview: $isPreview, id: $id) {
        ...contentFields
    }
`;

export const contentBySlug = `
    contentCollection(limit: 1, preview: $isPreview, where: {slug: $slug }) {
        items {
            ...contentFields
        }
    }
`;

export const pageBySlug = `
    pageCollection(limit: 1, preview: $isPreview, where: { slug: $slug }) {
        items {
            ...shortPageFields
        }
    }
`;

export const pageContentById = `
    page(preview: $isPreview, id: $id) {
        ...pageFields
    }
`;

export const pageContentBySlug = `
    pageCollection(limit: 1, preview: $isPreview, where: { slug: $slug }) {
        items {
            ...pageFields
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
