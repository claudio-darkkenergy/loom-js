import { component } from '@loomjs/core';

export const Header = component(
    (html, { children, className }) =>
        html`<header class=${className}>${children}</header>`
);
