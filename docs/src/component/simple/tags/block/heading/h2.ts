import { component } from '@loomjs/core';

export const H2 = component(
    (html, { children, className }) =>
        html`<h2 class=${className}>${children}</h2>`
);
