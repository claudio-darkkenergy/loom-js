import { component } from '../../../src';

import { TestComponentProps } from './container';

export const Input = component<TestComponentProps>(
    (html, { className, disabled, style, value }) => {
        return html`<input
            $style=${style}
            class=${className}
            disabled=${disabled}
            value=${value}
        />`;
    }
);
