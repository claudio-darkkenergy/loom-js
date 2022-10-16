import { component } from '@loom-js/core';

export const Underline = component(
    (html, { children, className }) =>
        html`<u class=${className}>${children}</u>`
);
