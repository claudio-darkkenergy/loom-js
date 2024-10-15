import { type SimpleComponent } from '@loom-js/core';
import { Div, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkLoaderProps = Omit<DivProps, 'className'> & {
    // Works with `percent` to show a progress vs. rotating loader.
    isLoading?: boolean;
    isSmall?: boolean;
    // Removes the circle color. The base color of the loader will change to transparent.
    // Ignored if `isLoading = true`
    isTransparent?: boolean;
    // 0-100 - works with `isLoading = true`
    percent?: number;
};

export const PinkLoader: SimpleComponent<PinkLoaderProps> = ({
    isLoading,
    isSmall,
    isTransparent,
    percent = 0,
    style,
    ...props
}) =>
    Div({
        ...props,
        className: classNames('loader', {
            'is-loading': isLoading,
            'is-small': isSmall,
            'is-transparent': isTransparent && !isLoading
        }),
        style: [
            style,
            isLoading ? { '--loading': `${percent}%` } : undefined,
            {
                '--loader-bg-color-light': 'var(--color-neutral-5)',
                '--loader-bg-color-dark': 'var(--color-neutral-100)'
            }
        ].flat()
    });
