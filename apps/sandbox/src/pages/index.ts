import { component, onRoute } from '@loom-js/core';

export const Index = component(
    (html) => html`
        <ul>
            <li><a $click=${onRoute} href="/core">Core</a></li>
            <li>
                <a $click=${onRoute} href="/event-monitoring">
                    Event Monitoring
                </a>
            </li>
            > Home
        </ul>
    `
);
