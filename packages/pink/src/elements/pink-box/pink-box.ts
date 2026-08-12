import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export type PinkBoxProps = ComponentInputProps;

export const PinkBox = component<PinkBoxProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'box')}
            id=${id}
            style=${style}
        >
            ${children}
        </div>
    `
);
