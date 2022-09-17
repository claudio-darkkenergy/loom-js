import { component } from '../../../src';

import { TestComponentProps } from './container';

export const Input = component<TestComponentProps>(
    (html, { className, disabled, style, value }) =>
        html`<input
            class=${className}
            disabled=${disabled}
            style=${style}
            value=${value}
        />`
);
