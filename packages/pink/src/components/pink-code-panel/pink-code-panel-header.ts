import { component, type ComponentInputProps } from '@loom-js/core';

import { cn } from '../../utils/cn';

export const PinkCodePanelHeader = component<ComponentInputProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <header
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${cn(className, 'code-panel-header')}
            id=${id}
            style=${style}
        >
            ${children}
        </header>
    `
);
