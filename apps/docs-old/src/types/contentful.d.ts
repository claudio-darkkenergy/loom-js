export interface ContentfulAsset {
    contentType: 'image/*' | 'image/jpg' | 'image/png' | 'image/webp';
    description: string;
    height: number | string;
    title: string;
    url: string;
    width: number | string;
}

export interface ContentfulGraphQlError {
    locations: ContentfulGraphQlErrorLocation[];
    message: string;
}

export interface ContentfulGraphQlErrorLocation {
    column: number;
    line: number;
}

export interface ContentfulGraphQlResponse<D> {
    data?: D;
    errors?: ContentfulGraphQlError[];
}
