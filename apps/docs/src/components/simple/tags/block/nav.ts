import { component } from '@loom-js/core';

export const Nav = component(
    (html, { children, className }) => html`
        <nav class=${className}>${children}</nav>
    `
);
