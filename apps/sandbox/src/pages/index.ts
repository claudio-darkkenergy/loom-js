import { component, onRoute } from '@loom-js/core';

export const Index = component(
    (html) => html`
        <ul>
            <li><a $click=${onRoute} href="/core">Core</a></li>
        </ul>
    `
);
