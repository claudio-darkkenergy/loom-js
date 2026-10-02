// A fixture loom app: one resource-backed page so the prerender phase has
// markup and state to inject, and a location readout so routes differ.
import { activity, component, locationEffect, resource } from '@loom-js/core';

interface Greeting {
    text: string;
}

export const GREETING_KEY = 'fixture:greeting';

const greeting = activity<Greeting | undefined>(
    undefined,
    async ({ update }) => {
        update(
            await resource(GREETING_KEY, async () => ({ text: 'hello from loom' }))
        );
    }
);

export const App = component((html, { onCreated }) => {
    onCreated(() => greeting.update(undefined));

    return html`
        <main>
            <h1>${locationEffect(({ value }) => value.pathname)}</h1>
            <p>${greeting.effect(({ value }) => value?.text ?? 'loading')}</p>
        </main>
    `;
});
