import type { PinkDynamicProps } from '../../types';
import { SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkGridBoxProps = PinkDynamicProps &
    UlProps & {
        cols?: 'auto' | string | number;
        gridAutoRows?:
            | 'auto'
            | 'max-content'
            | 'min-content'
            | 'inherit'
            | 'initial'
            | 'revert'
            | 'revert-layer'
            | 'unset'
            | string;
        gridGap?: string;
        gridItemSize?: string;
        gridItemSizeSmallScreens?: string;
    };

export const PinkGridBox: SimpleComponent<PinkGridBoxProps> = ({
    className,
    cols = 'auto',
    gridAutoRows,
    gridGap,
    gridItemSize,
    gridItemSizeSmallScreens,
    is = Ul,
    style,
    ...props
}) => {
    let gridTemplateColumns = !Number.isNaN(Number(cols))
        ? `repeat(${cols}, 1fr)`
        : undefined;

    return is({
        ...props,
        style: [
            style,
            {
                '--grid-gap': gridGap,
                '--grid-item-size': gridItemSize,
                '--grid-item-size-small-screens': gridItemSizeSmallScreens,
                'grid-auto-rows': gridAutoRows,
                'grid-template-columns': gridTemplateColumns
            }
        ],
        className: classNames(className, 'grid-box')
    });
};
