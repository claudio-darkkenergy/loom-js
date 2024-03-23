import type { PinkDynamicProps } from '../../types';
import type { SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkGridBoxProps = PinkDynamicProps & {
    cols?: string | number;
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
    cols,
    gridAutoRows,
    gridGap,
    gridItemSize,
    gridItemSizeSmallScreens,
    is = Div,
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
        ].flat(),
        className: classNames(className, 'grid-box')
    });
};
