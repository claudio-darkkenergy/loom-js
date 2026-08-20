// Dehydration tests (`dehydrate`, the server-side capture of a render's
// settled resource values). Node lane, against the built `dist/` entries —
// the server consumer's exact surface. Run via `pnpm test-server`.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { activity, component, resource, setDebug } =
    await import('../../dist/index.mjs');
const { dehydrate, renderToString, serializeState } =
    await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

describe('dehydrate', () => {
    it('captures settled resource values that survive a JSON round-trip', async () => {
        const page = activity(undefined, async ({ update }) => {
            update(
                await resource('page:intro', async () => ({
                    tags: ['alpha', 'beta'],
                    title: 'Intro'
                }))
            );
        });
        const App = component((html, { onCreated }) => {
            onCreated(() => page.update());

            return html`
                <main>
                    ${page.effect(({ value }) =>
                        value ? value.title : 'loading'
                    )}
                </main>
            `;
        });
        const win = createWindow();
        const markup = await renderToString(App(), { window: win });

        assert.match(markup, /Intro/);

        const state = dehydrate(win);
        const roundTripped = JSON.parse(JSON.stringify(state));

        assert.deepEqual(roundTripped, {
            'page:intro': { tags: ['alpha', 'beta'], title: 'Intro' }
        });
    });

    it('skips entries still pending when capture runs', async () => {
        const App = component((html, { onCreated }) => {
            onCreated(() => {
                resource('pending:settled', async () => 'ready');
                // Never settles — stands in for a fetch the render's
                // `maxWait` bound gave up on. (Called outside a transform, so
                // the settlement signal never sees it either way.)
                resource('pending:stuck', () => new Promise(() => {}));
            });

            return html`
                <div>shell</div>
            `;
        });
        const win = createWindow();

        await renderToString(App(), { window: win });

        assert.deepEqual(dehydrate(win), { 'pending:settled': 'ready' });
    });

    it('omits unserializable values with a debug-gated warning, keeping the rest', async () => {
        const originalWarn = globalThis.console.warn;
        const warnings = [];

        setDebug(true);
        globalThis.console.warn = (...args) => warnings.push(args.join(' '));

        try {
            const circular = {};

            circular.self = circular;

            const App = component((html, { onCreated }) => {
                onCreated(() => {
                    resource('degrade:circular', async () => circular);
                    resource('degrade:fn', async () => () => 'not data');
                    resource('degrade:good', async () => 42);
                });

                return html`
                    <div>shell</div>
                `;
            });
            const win = createWindow();

            await renderToString(App(), { window: win });

            const state = dehydrate(win);

            assert.deepEqual(state, { 'degrade:good': 42 });
            assert.equal(warnings.length, 2);
            assert.match(warnings.join('\n'), /degrade:circular/);
            assert.match(warnings.join('\n'), /degrade:fn/);
        } finally {
            globalThis.console.warn = originalWarn;
            setDebug(false);
        }
    });
});

describe('serializeState', () => {
    it('neutralizes script-breaking content and parses back to the original state', () => {
        const state = {
            'page:markup':
                'a sneaky </script><script>alert(1)</script> payload',
            'page:separators': 'line\u2028and\u2029paragraph'
        };
        const serialized = serializeState(state);

        assert.doesNotMatch(serialized, /</);
        assert.doesNotMatch(serialized, /[\u2028\u2029]/);
        assert.deepEqual(JSON.parse(serialized), state);
    });
});
