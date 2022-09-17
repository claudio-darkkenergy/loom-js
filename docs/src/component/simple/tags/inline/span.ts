import { component } from '@loomjs/core';

export const Span = component(
    (html, { children, className }) =>
        html`<span class=${className}>${children}</span>`
);
