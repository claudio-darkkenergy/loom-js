import { LinkProps } from '@loom-js/components/simple';

// GraphQl

export interface GraphQlRequestPayload {
    query: string;
    variables?: object;
}

// Content Structure Types

export interface AssetProps {
    alt?: string;
    src?: string;
    title?: string;
}

export interface NavItem {
    label?: string;
    url: string;
}

// export type PageProps = ContentProps<string[]>;

// export type Pages = PageProps[];

export interface NavProps {
    className?: string;
    navigation: LinkProps[];
}

// Media
export type ImageMimeTypes =
    | 'image/apng'
    | 'image/avif'
    | 'image/gif'
    | 'image/jpeg'
    | 'image/png'
    | 'image/svg+xml'
    | 'image/webp'
    | 'image/bmp'
    | 'image/x-icon'
    | 'image/tiff';

export type MediaMimeTypes = ImageMimeTypes | VideoMimeTypes;

export type VideoMimeTypes = 'video/mp4';
