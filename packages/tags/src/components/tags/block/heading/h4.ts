import { component } from '@loom-js/core';

export const H4 = component(
    (html, { children, className }) =>
        html`<h4 class=${className}>${children}</h4>`
);
