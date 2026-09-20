// Mixed DOM implementations in one process (server-dom-compat D3): the
// per-document template cache parses each template against the rendering
// document, so windows from different implementations can interleave renders
// of the same components — the old one-implementation-per-process rule is
// gone. Custom elements included: each window carries its own registry.
import { Window } from 'happy-dom';
import { JSDOM } from 'jsdom';
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { component, defineElement } = await import('../../dist/index.mjs');
const { renderToStringSync } = await import('../../dist/server.mjs');

const windowFactories = {
    'happy-dom': () => new Window(),
    jsdom: () =>
        new JSDOM('<!doctype html><html><head></head><body></body></html>')
            .window,
    linkedom: () =>
        parseHTML('<!doctype html><html><head></head><body></body></html>')
            .window
};

defineElement(
    'mixed-badge',
    (html, { children }) => html`
        <span class="badge">${children}</span>
    `
);

// One shared component set — the same chunks identities render through every
// implementation, which is exactly the cache behavior under test.
const App = component(
    (html, { impl }) => html`
        <main>
            <h1 class=${'impl'}>${impl}</h1>
            <mixed-badge>ok</mixed-badge>
        </main>
    `
);

describe('mixed DOM implementations in one process', () => {
    it('interleaved renders across implementations each produce correct markup', () => {
        // Two passes so every implementation renders both before and after
        // every other — cache entries must neither collide nor go stale.
        for (const pass of [1, 2]) {
            for (const [implName, createWindow] of Object.entries(
                windowFactories
            )) {
                const markup = renderToStringSync(
                    App({ impl: `${implName}-${pass}` }),
                    { window: createWindow() }
                );

                assert.match(
                    markup,
                    new RegExp(`<h1 class="impl">${implName}-${pass}</h1>`)
                );
                assert.match(markup, /<span class="badge">ok<\/span>/);
            }
        }
    });
});
