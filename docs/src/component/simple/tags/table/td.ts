import { component } from '@loomjs/core';

export const Td = component(
    (html, { children, className }) => html`
        <td class=${className}>${children}</td>
    `
);
