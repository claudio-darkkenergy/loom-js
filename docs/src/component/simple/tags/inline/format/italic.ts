import { component } from '@loomjs/core';

export const Italic = component(
    (html, { children, className }) =>
        html`<i class=${className}>${children}</i>`
);
