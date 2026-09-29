import { component, route } from '@loom-js/core';

export const Index = component(
    (html) => html`
        <ul>
            <li><a $click=${route} href="/core">Core</a></li>
            <li>
                <a $click=${route} href="/event-monitoring">Event Monitoring</a>
            </li>
            > Home
        </ul>
    `
);
