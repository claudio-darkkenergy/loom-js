import styles from './FocalContainer.module.css';
import {
    SecondaryContainer,
    SecondaryContainerProps
} from '@/app/components/containers/secondary-container';
import type { SimpleComponent } from '@loom-js/core';
import { Div, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

type FocalContainerProps = SecondaryContainerProps & {
    contentProps?: DivProps;
};

export const FocalContainer: SimpleComponent<FocalContainerProps> = ({
    children,
    className,
    contentProps = {},
    ...props
}) => {
    return SecondaryContainer({
        ...props,
        className: classNames(styles.focalContainer, className),
        children: Div({
            ...contentProps,
            children
        }),
        style: {
            'background-color': '#ff8a00',
            'background-image': 'linear-gradient(#ff8a00, #e52e71)',
            // 'border-radius': 'var(--border-radius-medium)',
            color: 'var(--heading-text-color)'
        }
    });
};
