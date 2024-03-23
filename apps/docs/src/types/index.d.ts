import { LinkProps } from '@app/components/simple';
import { ContentfulAsset } from '@app/types/contentful';
import { Document as RichTextDocument } from '@contentful/rich-text-types';
import { PlainObject } from '@loom-js/core';
import { ContentfulCollection } from 'contentful';

export interface Page {
    contentCollection?: ContentfulCollection<ContentProps>;
    slug?: string;
    title?: string;
}

export interface Site {
    icons: ContentfulAsset;
    logo: ContentfulAsset;
    pagesCollection: ContentfulCollection<Page>;
    seoDescription: string;
    shortDescription: string;
    title: string;
}

export interface ContentfulApp {
    siteCollection: ContentfulCollection<Site>;
}

// GraphQl

export interface GraphQlRequestPayload {
    query: string;
    variables?: PlainObject;
}

// Content Structure Types

interface ContentProps<T = ContentProps<unknown>> {
    content?: T;
    description?: {
        json: RichTextDocument;
    };
    slug?: string;
    title?: Node;
}

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
