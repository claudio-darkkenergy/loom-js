import { component } from '@loom-js/core';

export const Hgroup = component(
    (html, { children, className }) =>
        html`<hgroup class=${className}>${children}</hgroup>`
);
