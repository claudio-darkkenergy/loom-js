import { component } from '@loomjs/core';

export const Paragraph = component(
    (html, { children, className }) =>
        html`<p class=${className}>${children}</p>`
);
