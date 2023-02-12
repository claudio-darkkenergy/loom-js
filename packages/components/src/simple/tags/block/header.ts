import { component } from '@loom-js/core';

export const Header = component(
    (html, { children, className }) =>
        html`<header class=${className}>${children}</header>`
);
