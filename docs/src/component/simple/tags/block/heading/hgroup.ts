import { component } from '@loomjs/core';

export const Hgroup = component(
    (html, { children, className }) =>
        html`<hgroup class=${className}>${children}</hgroup>`
);
