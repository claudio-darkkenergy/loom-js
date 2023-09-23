import { component } from '../../../src';

import { TestComponentProps } from './container';

export const Input = component<TestComponentProps>(
    (html, { className, disabled, style, value }) => {
        console.log('Input value', className);
        return html`<input
            class=${className}
            disabled=${disabled}
            style=${style}
            value=${value}
        />`;
    }
);
