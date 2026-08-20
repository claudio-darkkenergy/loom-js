import type { ContentfulAsset, ContentfulDocument } from '@loom-js/contentful';
import type { TemplateTagValue } from '@loom-js/core';
import type { ContentfulCollection } from 'contentful';

export interface ContentfulApp {
    siteCollection: ContentfulCollection<Site>;
}

// Assembly types.

export interface Page {
    contentCollection?: ContentfulCollection<ContentProps>;
    slug?: string;
    title?: string;
}

export type PageSummary = Page & {
    contentCollection?: ContentfulCollection<ShortContentProps>;
};

export interface Site {
    icons: ContentfulAsset;
    logo: ContentfulAsset;
    pagesCollection: ContentfulCollection<Page>;
    seoDescription: string;
    shortDescription: string;
    title: string;
}

export type TopicProps = ContentProps<unknown>;

// Marks a failed content load in the content activities so views can render
// an error state instead of an indefinite skeleton.
export interface ContentLoadFailure {
    contentError: string;
}

// The combined payload behind a page navigation — side-nav listing + topic.
export interface PageContent {
    page?: PageSummary;
    topic?: TopicProps;
}

// Content Structure Types

interface ContentProps<T = ContentProps<unknown>> {
    content?: T;
    description?: {
        json: ContentfulDocument;
    };
    slug?: string;
    title?: Node;
}

interface ShortContentProps<T = ContentProps<unknown>> {
    _id: string;
    content?: T;
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

export interface NavLinkProps {
    children?: TemplateTagValue;
    className?: string;
    href?: string;
    target?: '_blank' | '_self';
}

export interface NavProps {
    className?: string;
    navigation: NavLinkProps[];
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
