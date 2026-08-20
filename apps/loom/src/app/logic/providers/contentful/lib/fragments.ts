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

export const basePageFields = `
fragment basePageFields on Page {
    title
    slug
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
