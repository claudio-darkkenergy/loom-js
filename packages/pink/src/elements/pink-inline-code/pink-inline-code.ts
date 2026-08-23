import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

/**
 * Inline code highlights a short snippet of code within a sentence, such as a
 * command, identifier, or file name.
 */
export const PinkInlineCode = component<ComponentInputProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <code
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'inline-code')}
            id=${id}
            style=${style}
        >
            ${children}
        </code>
    `
);
