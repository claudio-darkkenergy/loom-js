// The async `renderToString` settle policy (`unify-server-drain-on-settled`):
// the render gates on the settlement signal — the per-window pending-transform
// counter `settled()` and `hydrate` consume — bounded by `maxWait`. Node lane,
// against the built `dist/` entries — see render-to-string.test.mjs for why.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { activity, component } = await import('../../dist/index.mjs');
const { renderToString } = await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

// An app whose content lands through an async activity transform that awaits
// `workFactory`'s promise — the idiomatic tracked-data path.
const createAsyncApp = (workFactory) => {
    const page = activity('loading', async ({ update }) => {
        update(await workFactory());
    });

    return component((html, { onCreated }) => {
        onCreated(() => page.update());

        return html`
            <main>${page.effect(({ value }) => value)}</main>
        `;
    });
};

describe('renderToString settle policy', () => {
    it('serializes content from a transform spanning multiple macrotask hops', async () => {
        // Real I/O leaves the markup unchanged for many macrotasks — the old
        // markup-quiet drain declared quiet and serialized the fallback.
        const App = createAsyncApp(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve('slow content landed'), 30)
                )
        );
        const markup = await renderToString(App(), {
            window: createWindow()
        });

        assert.match(markup, /slow content landed/);
        assert.doesNotMatch(markup, /loading/);
    });

    it('serializes what has landed when maxWait expires, with a pending-count warning', async () => {
        // Framework warnings always surface — no `setDebug` call here, per
        // the diagnostic-logging capability.
        const originalWarn = globalThis.console.warn;
        const warnings = [];

        globalThis.console.warn = (...args) => warnings.push(args.join(' '));

        try {
            const App = createAsyncApp(() => new Promise(() => {}));
            const markup = await renderToString(App(), {
                maxWait: 50,
                window: createWindow()
            });

            assert.match(markup, /loading/);
            assert.match(
                warnings.join('\n'),
                /renderToString: settlement did not complete within 50ms.*1 operation\(s\) still pending/
            );
        } finally {
            globalThis.console.warn = originalWarn;
        }
    });

    it('waits indefinitely with maxWait: Infinity', async () => {
        const App = createAsyncApp(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve('unbounded landed'), 20)
                )
        );
        const markup = await renderToString(App(), {
            maxWait: Infinity,
            window: createWindow()
        });

        assert.match(markup, /unbounded landed/);
    });
});
