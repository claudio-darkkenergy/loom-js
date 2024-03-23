import styles from './styles.scss';
import { component } from '@loom-js/core';
import { Button, ButtonProps } from '@loom-js/tags';
import classNames from 'classnames';

export type { ButtonProps };

export const PageControl = component<ButtonProps>(
    (html, { className, ...buttonProps }) => html`
        <template>
            ${Button({
                ...buttonProps,
                className: classNames(styles.pageControl, className)
            })}
        </template>
    `
);
