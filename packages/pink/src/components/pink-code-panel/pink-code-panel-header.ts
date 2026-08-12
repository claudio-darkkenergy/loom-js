import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

export const PinkCodePanelHeader = component<ComponentInputProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <header
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'code-panel-header')}
            id=${id}
            style=${style}
        >
            ${children}
        </header>
    `
);
