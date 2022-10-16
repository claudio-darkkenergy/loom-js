import { component } from '@loom-js/core';

export const Blockquote = component(
    (html, { children, className }) =>
        html`<blockquote class=${className}>${children}</blockquote>`
);
