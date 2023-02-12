import { component } from '@loom-js/core';

export const H2 = component(
    (html, { children, className }) =>
        html`<h2 class=${className}>${children}</h2>`
);
