// Server-lane parity for `table-aware-template-parsing`: `renderToStringSync`
// against an injected linkedom window must serialize the same table structure
// the browser produces — table-part roots intact, dynamic rows inside their
// section, nothing foster-parented out of the table.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { component, el } = await import('../../dist/index.mjs');
const { renderToStringSync } = await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

const Row = component(
    (html, { label }) => html`
        <tr data-row=${label}><td>${label}</td></tr>
    `
);

describe('renderToStringSync (table templates)', () => {
    it('keeps a tr-rooted component template rooted at <tr>', () => {
        const App = component(
            (html) => html`
                <table>
                    <tbody>${Row({ label: 'alpha' })}</tbody>
                </table>
            `
        );
        const markup = renderToStringSync(App(), { window: createWindow() });

        assert.match(markup, /<tbody>\s*<tr data-row="alpha">/);
        assert.match(markup, /<td>alpha<\/td>/);
    });

    it('renders a dynamic row list inside its section, in order', () => {
        const labels = ['alpha', 'beta', 'gamma'];
        const App = component(
            (html) => html`
                <main>
                    <table>
                        <tbody>${labels.map((label) => Row({ label }))}</tbody>
                    </table>
                </main>
            `
        );
        const markup = renderToStringSync(App(), { window: createWindow() });

        assert.equal(markup.match(/<tr data-row=/g)?.length, 3);
        assert.match(
            markup,
            /<tr data-row="alpha">[\s\S]*<tr data-row="beta">[\s\S]*<tr data-row="gamma">/
        );
        assert.match(
            markup,
            /<main>\s*<table>/,
            'no nodes leaked before the table'
        );
    });

    it('renders el() table-part components as their named elements', () => {
        const App = component(
            (html) => html`
                <main>
                    ${el('table')({
                        children: el('tbody')({
                            children: [
                                Row({ label: 'one' }),
                                Row({ label: 'two' })
                            ]
                        })
                    })}
                </main>
            `
        );
        const markup = renderToStringSync(App(), { window: createWindow() });

        assert.match(
            markup,
            /<table[^>]*>[\s\S]*<tbody[^>]*>[\s\S]*<tr data-row="one">/
        );
        assert.equal(markup.match(/<td>/g)?.length, 2);
    });

    it('resolves text and attribute slots in text-allowing table positions', () => {
        const App = component(
            (html) => html`
                <table>
                    <caption>${'the-caption'}</caption>
                    <tbody>
                        <tr class=${'row-class'}>
                            <td>${'the-cell'}</td>
                        </tr>
                    </tbody>
                </table>
            `
        );
        const markup = renderToStringSync(App(), { window: createWindow() });

        assert.match(markup, /<caption>the-caption<\/caption>/);
        assert.match(markup, /<tr class="row-class">/);
        assert.match(markup, /<td>the-cell<\/td>/);
    });
});
