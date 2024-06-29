import { component, onRoute } from '@loom-js/core';

export const Core = component(
    (html) => html`
        <h1>
            <a $click=${onRoute} href="/">Index</a>
            > Core
        </h1>
    `
);
