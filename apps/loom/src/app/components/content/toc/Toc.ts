import { type SimpleComponent } from '@loom-js/core';
import { H4, Link, Nav, Ul } from '@loom-js/tags';

type TocItem = {
    title: string;
    url: string;
};

export type TocProps = {
    items?: TocItem[];
    title?: string;
};

export const Toc: SimpleComponent<TocProps> = ({ items, title, ...props }) => {
    return Nav({
        ...props,
        children: [
            H4({ className: 'heading-level-7', children: title }),
            Ul({
                item: Link,
                itemProps: items?.map(({ title, url }) => ({
                    children: title,
                    href: url
                }))
            })
        ]
    });
};
