import { component } from '@loomjs/core';

export const Th = component(
    (html, { children, className }) => html`
        <th class=${className}>${children}</th>
    `
);
