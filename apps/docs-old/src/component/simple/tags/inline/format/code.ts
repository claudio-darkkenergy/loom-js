import { component } from '@loom-js/core';

export const Code = component(
    (html, { children, className }) =>
        html`<code class=${className}>${children}</code>`
);
