import {
    component,
    type Component,
    type ComponentInputProps
} from '@loom-js/core';

import styles from './Toc.module.css';

export type TocItem = {
    // Not `children` — that's the reserved prop.
    items?: TocItem[];
    // Both absent on a headerless group.
    title?: string;
    url?: string;
};

export type TocProps = ComponentInputProps<{
    items?: TocItem[];
    title?: string;
}>;

const TocLink = component<ComponentInputProps<{ href?: string }>>(
    (html, { children, href }) => html`
        <a href=${href} target="_self">${children}</a>
    `
);

// Mutually recursive with `TocListItem`, hence the explicit types.
const TocList: Component<{ items?: TocItem[] }> = component<{
    items?: TocItem[];
}>(
    (html, { className, items }) => html`
        <ul class=${className}>
            ${items?.map((item) => TocListItem(item))}
        </ul>
    `
);

const TocListItem: Component<TocItem> = component<TocItem>(
    (html, { items, title, url }) => html`
        <li>
            ${url && TocLink({ children: title, href: url })}
            ${items?.length && TocList({ className: styles.subList, items })}
        </li>
    `
);

export const Toc = component<TocProps>(
    (html, { attrs, className, id, items, on, onClick, style, title }) => html`
        <nav
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${className}
            id=${id}
            style=${style}
        >
            <h4 class="heading-level-7">${title}</h4>
            ${TocList({ items })}
        </nav>
    `
);
