import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export type PinkLoaderProps = ComponentInputProps<{
    // Works with `percent` to show a progress vs. rotating loader.
    // `false` or `undefined` results in a rotating loader.
    isLoading?: boolean;
    isSmall?: boolean;
    // Removes the circle color. The base color of the loader will change to transparent.
    // Ignored if `isLoading = true`
    isTransparent?: boolean;
    // 0-100 - works with `isLoading = true`
    percent?: number;
}>;

// The `loader` class owns the visual — a caller `className` is not part of
// the contract (matching the pre-conversion API, which dropped it).
export const PinkLoader = component<PinkLoaderProps>(
    (
        html,
        {
            attrs,
            children,
            id,
            isLoading,
            isSmall,
            isTransparent,
            on,
            onClick,
            percent = 0,
            style
        }
    ) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames('loader', {
                'is-loading': isLoading,
                'is-small': isSmall,
                'is-transparent': isTransparent && !isLoading
            })}
            id=${id}
            style=${[
                style,
                isLoading ? { '--loading': `${percent}%` } : undefined,
                {
                    '--loader-bg-color-light': 'var(--color-neutral-5)',
                    '--loader-bg-color-dark': 'var(--color-neutral-100)'
                }
            ]}
        >
            ${children}
        </div>
    `
);
