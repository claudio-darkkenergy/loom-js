const imageUrlBase = 'https://images.ctfassets.net';

export type MediaOptions = {
    assetId: string;
    filename: string;
    fit?: 'crop' | 'fill' | 'pad' | 'scale' | 'thumb';
    format: 'avif' | 'gif' | 'jpg' | 'png' | 'webp';
    height?: number;
    // Default is 100
    quality?: number;
    spaceId: string;
    uid: string;
    width?: number;
};

export type MediaUrls = {
    [key: string]: (options: Partial<MediaOptions>) => string;
};

const param = (key: string, value?: number | string) =>
    value ? `&${key}=${value}` : '';

export const getImageUrl = ({
    assetId,
    filename,
    fit,
    format,
    height,
    quality,
    spaceId,
    uid,
    width
}: Partial<MediaOptions>) =>
    `${imageUrlBase}/${
        spaceId
    }/${assetId}/${uid}/${filename}?fm=${format}${param('fit', fit)}${param(
        'h',
        height
    )}${param('w', width)}${param('q', quality)}`;
