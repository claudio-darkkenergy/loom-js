// Server-lane parity for the template whitespace collapse: the statics are
// collapsed before any DOM implementation parses them, so an injected
// linkedom window serializes the same markup the browser renders.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { component } = await import('../../dist/index.mjs');
const { renderToStringSync } = await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

describe('renderToStringSync (whitespace collapse)', () => {
    it('serializes formatting whitespace out and authored spacing in', () => {
        // prettier-ignore
        const App = component(
            (html, { value }) => html`
                <article>
                    <h1>Hello <b>world</b></h1>
                    <p>
                        Total:
                        ${value}
                        items
                    </p>
                    <code>
                        ${value}
                    </code>
                </article>
            `
        );
        const markup = renderToStringSync(App({ value: 3 }), {
            window: createWindow()
        });

        assert.equal(
            markup,
            '<article><h1>Hello <b>world</b></h1> <p>Total: 3 items</p> <code>3</code></article>'
        );
    });

    it('keeps pre content verbatim', () => {
        // prettier-ignore
        const App = component(
            (html, { value }) => html`
                <pre>one
  ${value}
    three</pre>
            `
        );
        const markup = renderToStringSync(App({ value: 'two' }), {
            window: createWindow()
        });

        assert.equal(markup, '<pre>one\n  two\n    three</pre>');
    });
});
