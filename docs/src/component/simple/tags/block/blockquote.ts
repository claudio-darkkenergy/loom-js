import { component } from '@loomjs/core';

export const Blockquote = component(
    (html, { children, className }) =>
        html`<blockquote class=${className}>${children}</blockquote>`
);
