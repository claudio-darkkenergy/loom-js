import { component } from '@loomjs/core';

export const Underline = component(
    (html, { children, className }) =>
        html`<u class=${className}>${children}</u>`
);
