import { component } from '@loomjs/core';

export const H1 = component(
    (html, { children, className }) =>
        html`<h1 class=${className}>${children}</h1>`
);
