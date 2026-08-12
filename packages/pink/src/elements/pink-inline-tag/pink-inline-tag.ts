import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export interface PinkInlineTagProps {
    isDisabled?: boolean;
    isInfo?: boolean;
}

/**
 * An inline tag is used as a number label inside a button. Some possible use cases are indicating
 * the number of columns in a table or the number of related items.
 */
export const PinkInlineTag = component<ComponentInputProps<PinkInlineTagProps>>(
    (
        html,
        {
            attrs,
            children,
            className,
            id,
            isDisabled,
            isInfo,
            on,
            onClick,
            style
        }
    ) => html`
        <span
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'inline-tag', {
                'is-disabled': isDisabled,
                'is-info': isInfo
            })}
            id=${id}
            style=${style}
        >
            ${children}
        </span>
    `
);
