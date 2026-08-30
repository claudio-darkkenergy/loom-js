import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export interface PinkTooltipPopupProps {
    isBottom?: boolean;
    isCenter?: boolean;
    isEnd?: boolean;
}

/**
 * The tooltip bubble itself — pink's `.tooltip-popup`, shown by a `.tooltip`
 * host on hover/focus. Composed by the `withTooltip` modifier and by any
 * component that renders its own host (e.g. `PinkCopyToClipboard`).
 */
export const PinkTooltipPopup = component<
    ComponentInputProps<PinkTooltipPopupProps>
>(
    (
        html,
        { attrs, children, className, id, isBottom, isCenter, isEnd, on, style }
    ) => html`
        <span
            $attrs=${attrs}
            $on=${on}
            class=${classNames(className, 'tooltip-popup', {
                'is-bottom': isBottom,
                'is-center': isCenter,
                'is-end': isEnd
            })}
            id=${id}
            role="tooltip"
            style=${style}
        >
            ${children}
        </span>
    `
);
