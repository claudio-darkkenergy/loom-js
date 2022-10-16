import { component, ComponentNode, TemplateTagValue } from '@loom-js/core';
import classNames from 'classnames';

import styles from './styles.scss';

export interface DrawerProps {
    className?: string;
    closeButton?: ComponentNode;
    contents: TemplateTagValue;
    isActive: boolean;
}

export const Drawer = component<DrawerProps>(
    (html, { className, closeButton, contents, isActive }) => html`
        <div
            class="${classNames(
                {
                    [styles.active]: isActive
                },
                className,
                styles.drawer
            )}"
        >
            ${closeButton} ${contents}
        </div>
    `
);
