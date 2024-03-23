import { component } from '@loom-js/core';
import classNames from 'classnames';

import { Button, ButtonProps } from '@app/component/simple';

import styles from './styles.scss';

export type { ButtonProps };

export const PageControl = component<ButtonProps>(
    (html, { className, ...buttonProps }) =>
        html`
            <template>
                ${Button({
                    ...buttonProps,
                    className: classNames(styles.pageControl, className)
                })}
            </template>
        `
);
