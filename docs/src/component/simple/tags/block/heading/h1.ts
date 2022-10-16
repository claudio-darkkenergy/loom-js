import { component } from '@loom-js/core';

export const H1 = component(
    (html, { children, className }) =>
        html`<h1 class=${className}>${children}</h1>`
);
