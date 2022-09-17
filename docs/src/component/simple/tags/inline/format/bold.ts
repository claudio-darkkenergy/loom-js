import { component } from '@loomjs/core';

export const Bold = component(
    (html, { children, className }) =>
        html`<b class=${className}>${children}</b>`
);
