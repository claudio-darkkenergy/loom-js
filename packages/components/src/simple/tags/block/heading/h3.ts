import { component } from '@loom-js/core';

export const H3 = component(
    (html, { children, className }) =>
        html`<h3 class=${className}>${children}</h3>`
);
