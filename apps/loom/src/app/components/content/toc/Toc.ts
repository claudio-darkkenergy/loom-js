import {
    component,
    type AttrBinding,
    type Component,
    type ComponentInputProps,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

import styles from './Toc.module.css';

export type TocItem = {
    // Not `children` — that's the reserved prop.
    items?: TocItem[];
    // Both absent on a headerless group.
    title?: string;
    url?: string;
};

/**
 * A reactive source of the active entry's fragment id (`''` for none) —
 * the `bind` half of an activity, so each entry's marking follows it in
 * place without a TOC re-render.
 */
export type TocActiveId = {
    bind(select: (activeId: string) => TemplateTagValue): AttrBinding<string>;
};

export type TocProps = ComponentInputProps<{
    activeId?: TocActiveId;
    items?: TocItem[];
    title?: string;
}>;

type TocLinkProps = ComponentInputProps<{
    activeId?: TocActiveId;
    href?: string;
}>;

const TocLink = component<TocLinkProps>(
    (html, { activeId, children, href }) => {
        // An entry is active when its fragment is the active id.
        const fragment = href?.startsWith('#') ? href.slice(1) : undefined;
        const isActive = (id: string) => !!fragment && id === fragment;

        return html`
            <a
                aria-current=${activeId?.bind((id) => isActive(id) && 'location')}
                class=${activeId?.bind((id) =>
                    classNames({ [styles.active]: isActive(id) })
                )}
                href=${href}
                target="_self"
            >
                ${children}
            </a>
        `;
    }
);

type TocListProps = {
    activeId?: TocActiveId;
    items?: TocItem[];
};

type TocListItemProps = TocItem & { activeId?: TocActiveId };

// Mutually recursive with `TocListItem`, hence the explicit types.
const TocList: Component<TocListProps> = component<TocListProps>(
    (html, { activeId, className, items }) => html`
        <ul class=${className}>
            ${items?.map((item) => TocListItem({ ...item, activeId }))}
        </ul>
    `
);

const TocListItem: Component<TocListItemProps> = component<TocListItemProps>(
    (html, { activeId, items, title, url }) => html`
        <li>
            ${url && TocLink({ activeId, children: title, href: url })}
            ${
                items?.length &&
                TocList({ activeId, className: styles.subList, items })
            }
        </li>
    `
);

export const Toc = component<TocProps>(
    (
        html,
        { activeId, attrs, className, id, items, on, onClick, style, title }
    ) => html`
        <nav
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${className}
            id=${id}
            style=${style}
        >
            <h4 class="heading-level-7">${title}</h4>
            ${TocList({ activeId, items })}
        </nav>
    `
);
