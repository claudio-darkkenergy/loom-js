import styles from './Breadcrumbs.module.css';
import type { SimpleComponent } from '@loom-js/core';
import { Ol, Span } from '@loom-js/tags';
import classNames from 'classnames';

export type BreadcrumbsProps = { pathname: string };

export const Breadcrumbs: SimpleComponent<BreadcrumbsProps> = ({
    pathname,
    ...props
}) => {
    const itemProps = pathname
        .replace(/^\//, '')
        .split('/')
        .map((path) => ({ children: path.replace('-', ' ') }));

    return Ol({
        ...props,
        className: classNames('u-flex', styles.breadcrumbs),
        item: Span,
        itemProps,
        listItemProps: { className: styles.breadcrumb }
    });
};
