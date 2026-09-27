import { ContentfulDocument } from '@loom-js/contentful';
import { simple } from '@loom-js/core';

import { collectHeadingAnchors } from '../styled-rich-text/lib/heading';
import { Toc, type TocItem } from '../toc';

export type TopicTocProps = {
    json?: ContentfulDocument;
};

// One walk over the shared anchor pass, in document order.
const toTocItems = (json?: ContentfulDocument): TocItem[] => {
    const items: TocItem[] = [];
    let open: TocItem | undefined;

    for (const { id, level, text } of collectHeadingAnchors(json).entries) {
        const item: TocItem = { title: text, url: `#${id}` };

        // An h2 opens an entry.
        if (level === 2) {
            open = item;
            items.push(item);
            continue;
        }

        // An h3 before any h2 (not a shape the conventions allow) gets a
        // headerless group instead of being dropped.
        if (!open) {
            open = { items: [] };
            items.push(open);
        }

        // An h3 nests under the open entry.
        (open.items ??= []).push(item);
    }

    return items;
};

export const TopicToc = simple<TopicTocProps>(({ json, ...props }) =>
    Toc({
        ...props,
        title: 'On this page',
        items: toTocItems(json)
    })
);
