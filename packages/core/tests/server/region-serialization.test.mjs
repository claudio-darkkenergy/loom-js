// Region serialization parity (`fix-ssr-region-null-text`): compiled
// component-element regions — the children region and each provided named
// slot — must serialize under `renderToString` identical to the browser's
// rendering of the same template, with no artifact text nodes. The fixtures
// mirror Panel/Card from the browser suites
// (tests/unit/compile-component-tags/fixtures.ts); pinned-markup assertions
// collapse the inter-tag whitespace prettier formats into plain-HTML
// templates, and the element-vs-functional-form check pins the same parity
// the browser slot suite does. Runs in Node against the built `dist/`
// entries — see render-to-string.test.mjs for why.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

const { component } = await import('../../dist/index.mjs');
const { renderToString } = await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

// Inter-tag whitespace only — text content (and any artifact text, like a
// stray "null") survives collapsing and still fails the comparison.
const collapse = (markup) => markup.replace(/>\s+</g, '><').trim();

const Panel = component(
    (html, { children }) => html`
        <section data-panel>${children}</section>
    `
);
const Card = component(
    (html, { children, slots }) => html`
        <article>
            <header data-header>${slots?.header}</header>
            <div data-body>${children}</div>
            <footer data-footer>${slots?.footer}</footer>
        </article>
    `
);

describe('compiled region serialization parity', () => {
    it('serializes a children region with no artifact text', async () => {
        const App = component(
            (html) => html`<main><${Panel}><p>Body</p></></main>`
        );

        const markup = await renderToString(App(), {
            window: createWindow()
        });

        assert.equal(
            collapse(markup),
            '<main><section data-panel=""><p>Body</p></section></main>'
        );
    });

    it('serializes mixed text-and-element children exactly', async () => {
        const App = component(
            (html) => html`<main><${Panel}>lead <b>bold</b> tail</></main>`
        );

        const markup = await renderToString(App(), {
            window: createWindow()
        });

        assert.equal(
            collapse(markup),
            '<main><section data-panel="">lead <b>bold</b> tail</section></main>'
        );
    });

    it('serializes provided named-slot regions clean and absent regions empty', async () => {
        const App = component(
            (html) =>
                html`<main><${Card}><h2 slot="header">Title</h2><p>Body</p></></main>`
        );

        const markup = await renderToString(App(), {
            window: createWindow()
        });

        assert.equal(
            collapse(markup),
            '<main><article><header data-header=""><h2 slot="header">Title</h2></header><div data-body=""><p>Body</p></div><footer data-footer=""></footer></article></main>'
        );
    });

    it('serializes every provided region of a multi-slot card', async () => {
        const App = component(
            (html) =>
                html`<main><${Card}><h2 slot="header">Title</h2><p>Body</p><b slot="footer">Fine print</b></></main>`
        );

        const markup = await renderToString(App(), {
            window: createWindow()
        });

        assert.equal(
            collapse(markup),
            '<main><article><header data-header=""><h2 slot="header">Title</h2></header><div data-body=""><p>Body</p></div><footer data-footer=""><b slot="footer">Fine print</b></footer></article></main>'
        );
    });

    it('renders identical to the functional form', async () => {
        const Title = component(
            (html) => html`
                <h2>Title</h2>
            `
        );
        const Body = component(
            (html) => html`
                <p>Body</p>
            `
        );
        const ElementForm = component(
            (html) =>
                html`<main><${Card}><${Title} slot="header" /><${Body} /></></main>`
        );
        const FunctionalForm = component(
            (html) => html`
                <main>
                    ${Card({
                        children: Body({}),
                        slots: { header: Title({}) }
                    })}
                </main>
            `
        );

        const elementMarkup = await renderToString(ElementForm(), {
            window: createWindow()
        });
        const functionalMarkup = await renderToString(FunctionalForm(), {
            window: createWindow()
        });

        assert.equal(collapse(elementMarkup), collapse(functionalMarkup));
    });
});
