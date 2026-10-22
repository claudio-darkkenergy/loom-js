import { component, type ComponentInputProps } from '@loom-js/core';

import { cn } from '../../utils/cn';

export type PinkBoxProps = ComponentInputProps;

export const PinkBox = component<PinkBoxProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${cn(className, 'box')}
            id=${id}
            style=${style}
        >
            ${children}
        </div>
    `
);
