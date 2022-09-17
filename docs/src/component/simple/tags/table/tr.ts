import { component } from '@loomjs/core';

export const Tr = component(
    (html, { children, className }) => html`
        <tr class=${className}>
            ${children}
        </tr>
    `
);
