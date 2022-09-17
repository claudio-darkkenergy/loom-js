import { component } from '@loomjs/core';

export const H3 = component(
    (html, { children, className }) =>
        html`<h3 class=${className}>${children}</h3>`
);
