import { component } from '@loom-js/core';

export const Pre = component(
    (html, { children, className }) =>
        html`<pre class=${className}>${children}</pre>`
);
