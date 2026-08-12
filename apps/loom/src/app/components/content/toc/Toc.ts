import { component, type ComponentInputProps } from '@loom-js/core';

type TocItem = {
    title: string;
    url: string;
};

export type TocProps = ComponentInputProps<{
    items?: TocItem[];
    title?: string;
}>;

const TocLinkItem = component<ComponentInputProps<{ href?: string }>>(
    (html, { children, href }) => html`
        <li><a href=${href} target="_self">${children}</a></li>
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
            <ul>
                ${items?.map(({ title: itemTitle, url }) =>
                    TocLinkItem({ children: itemTitle, href: url })
                )}
            </ul>
        </nav>
    `
);
