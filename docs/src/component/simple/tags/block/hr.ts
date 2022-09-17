import { component } from '@loomjs/core';

export const Hr = component(
    (html, { className }) => html`<hr class=${className} />`
);
