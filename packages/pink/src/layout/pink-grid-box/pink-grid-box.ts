import { el, type ComponentInputProps, simple } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';

export type PinkGridBoxProps = ComponentInputProps<
    PinkDynamicProps & {
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
    }
>;

// Pure delegation — the root element comes entirely from `is`.
export const PinkGridBox = simple<PinkGridBoxProps>(
    ({
        className,
        cols = 'auto',
        gridAutoRows,
        gridGap,
        gridItemSize,
        gridItemSizeSmallScreens,
        is = el('ul'),
        style,
        ...props
    }) => {
        const gridTemplateColumns = !Number.isNaN(Number(cols))
            ? `repeat(${cols}, 1fr)`
            : undefined;

        return is({
            ...props,
            // Omitted entirely when empty — a style value that resolves to
            // nothing must not reach the root's style binding.
            style:
                gridAutoRows === undefined &&
                gridGap === undefined &&
                gridItemSize === undefined &&
                gridItemSizeSmallScreens === undefined &&
                gridTemplateColumns === undefined
                    ? style
                    : [
                          style,
                          {
                              '--grid-gap': gridGap,
                              '--grid-item-size': gridItemSize,
                              '--grid-item-size-small-screens':
                                  gridItemSizeSmallScreens,
                              'grid-auto-rows': gridAutoRows,
                              'grid-template-columns': gridTemplateColumns
                          }
                      ],
            className: classNames(className, 'grid-box')
        });
    }
);
