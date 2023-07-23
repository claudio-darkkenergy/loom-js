import { component } from '@loom-js/core';

export const Italic = component(
    (html, { children, className }) =>
        html`<i class=${className}>${children}</i>`
);
