import { component, onRoute } from '@loom-js/core';
import { track } from '@loom-js/monitor';

export const EventMonitoring = component((html) => {
    const trackEvent = () =>
        track(__API_URL__, {
            data: 'test',
            label: 'test-label',
            service: 'Event Monitoring'
        });

    const evMonitoring = html`
        <div>
            <h1>
                <a $click=${onRoute} href="/">Index</a>
                <a $click=${onRoute} href="/core">Core</a>
                > Event Monitoring
            </h1>

            <button $click=${() => trackEvent()}>Track Event</button>
        </div>
    `;

    console.log({ evMonitoring });

    return evMonitoring;
});
