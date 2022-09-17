import { component } from '@loomjs/core';

export const H5 = component(
    (html, { children, className }) =>
        html`<h5 class=${className}>${children}</h5>`
);
