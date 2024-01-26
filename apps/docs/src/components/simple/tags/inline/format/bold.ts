import { component } from '@loom-js/core';

export const Bold = component(
    (html, { children, className }) =>
        html`<b class=${className}>${children}</b>`
);
