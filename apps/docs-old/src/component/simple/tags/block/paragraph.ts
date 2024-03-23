import { component } from '@loom-js/core';

export const Paragraph = component(
    (html, { children, className }) =>
        html`<p class=${className}>${children}</p>`
);
