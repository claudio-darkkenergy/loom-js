import { component } from '@loom-js/core';

export const Th = component(
    (html, { children, className }) => html`
        <th class=${className}>${children}</th>
    `
);
