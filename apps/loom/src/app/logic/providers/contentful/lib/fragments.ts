export const baseContentFields = `
fragment baseContentFields on Content {
    title
    slug
}
`;

export const contentFields = `
fragment contentFields on Content {
    ...baseContentFields
    description {
        json
    }
}
`;

export const shortContentFields = `
fragment shortContentFields on Content {
    ...baseContentFields
    _id
}
`;

export const basePageFields = `
fragment basePageFields on Page {
    title
    slug
}
`;

export const pageFields = `
fragment pageFields on Page {
    ...basePageFields
    contentCollection(limit: 20) {
        items {
            ...contentFields
        }
    }
}
`;

export const shortPageFields = `
fragment shortPageFields on Page {
    ...basePageFields
    contentCollection(limit: 20) {
        items {
            ...baseContentFields
        }
    }
}
`;
