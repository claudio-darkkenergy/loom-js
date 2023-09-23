export const contentFields = `
fragment contentFields on Content {
    title
    description {
        json
    }
}
`;

export const pageFields = `
fragment pageFields on Page {
    title
    slug
    contentCollection(limit: 20) {
        items {
            ...contentFields
        }
    }
}
`;

export const pageContentById = `
    page(preview: $isPreview, id: $id) {
        ...pageFields
        title
        slug
        contentCollection(limit: 20) {
            items {
                ...contentFields
            }
        }
    }
`;

export const pageContentBySlug = `
    pageCollection(limit: 1, preview: $isPreview, where: { slug: $slug }) {
        items {
            ...pageFields
            title
            slug
            contentCollection(limit: 20) {
                items {
                    ...contentFields
                }
            }
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
