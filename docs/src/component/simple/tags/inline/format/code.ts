import { component } from '@loomjs/core';

export const Code = component(
    (html, { children, className }) =>
        html`<code class=${className}>${children}</code>`
);
