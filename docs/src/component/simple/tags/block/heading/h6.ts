import { component } from '@loomjs/core';

export const H6 = component(
    (html, { children, className }) =>
        html`<h6 class=${className}>${children}</h6>`
);
