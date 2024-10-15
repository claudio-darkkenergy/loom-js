const imageUrlBase = 'https://images.ctfassets.net';

export type MediaOptions = {
    assetId: string;
    filename: string;
    fit?: 'crop' | 'fill' | 'pad' | 'scale' | 'thumb';
    format: 'avif' | 'gif' | 'jpg' | 'png' | 'webp';
    height?: number;
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
    uid,
    width
}: Partial<MediaOptions>) =>
    `${imageUrlBase}/${
        process.env.CTF_SPACE_ID
    }/${assetId}/${uid}/${filename}?fm=${format}${param('fit', fit)}${param(
        'h',
        height
    )}${param('w', width)}`;
