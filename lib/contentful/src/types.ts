import { ContentfulDocument } from './rich-text-renderer';
import { LinkProps } from '@loom-js/tags';

export interface ContentfulAsset {
    contentType: 'image/*' | 'image/jpg' | 'image/png' | 'image/webp';
    description: string;
    height: number | string;
    title: string;
    url: string;
    width: number | string;
}

// Content Structure Types

export interface ContentProps<T = ContentProps<unknown>> {
    content?: T;
    description?: {
        json: ContentfulDocument;
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
