import { component } from '@loom-js/core';

export const Td = component(
    (html, { children, className }) => html`
        <td class=${className}>${children}</td>
    `
);
