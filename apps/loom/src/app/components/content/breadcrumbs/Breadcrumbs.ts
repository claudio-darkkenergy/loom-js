import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import styles from './Breadcrumbs.module.css';

export type BreadcrumbsProps = ComponentInputProps<{ pathname: string }>;

const BreadcrumbItem = component<ComponentInputProps>(
    (html, { children }) => html`
        <li class=${styles.breadcrumb}><span>${children}</span></li>
    `
);

export const Breadcrumbs = component<BreadcrumbsProps>(
    (html, { attrs, id, on, onClick, pathname, style }) => html`
        <ol
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames('u-flex', styles.breadcrumbs)}
            id=${id}
            style=${style}
        >
            ${pathname
                .replace(/^\//, '')
                .split('/')
                .map((path) =>
                    BreadcrumbItem({ children: path.replace('-', ' ') })
                )}
        </ol>
    `
);
