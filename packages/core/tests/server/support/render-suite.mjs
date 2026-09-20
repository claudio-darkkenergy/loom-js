// The DOM-implementation matrix suite (server-dom-compat D2): the server
// render tests, parameterized by window factory so the same scenarios run
// against linkedom, jsdom, and Happy DOM. One implementation per process —
// the template cache keys against the first document's realm — so each
// implementation gets its own `*.test.mjs` entry file (node's test runner
// isolates files in separate processes) and this module holds the shared
// body. Lives under `support/` so the `tests/server/*.test.mjs` glob does not
// pick it up directly.
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

// Importing the package index off-browser must not throw — this import IS an
// assertion (routing/router/config previously crashed at module load).
const { activity, component, defineElement, locationEffect } =
    await import('../../../dist/index.mjs');
const { renderToStringSync } = await import('../../../dist/server.mjs');

const Item = component(
    (html, { label }) => html`
        <li class="item">${label}</li>
    `
);
const List = component(
    (html, { items }) => html`
        <ul data-count=${() => String(items.length)}>
            ${items.map((label) => Item({ label }))}
        </ul>
    `
);

export const defineRenderSuite = (implName, createWindow) => {
    describe(`renderToStringSync [${implName}]`, () => {
        it('renders a representative component tree to markup', () => {
            const App = component(
                (html, { heading, items }) => html`
                    <main>
                        <h1 class=${'title'}>${heading}</h1>
                        ${List({ items })}
                    </main>
                `
            );
            const markup = renderToStringSync(
                App({
                    heading: 'Hello SSR',
                    items: ['alpha', 'beta', 'gamma']
                }),
                { window: createWindow() }
            );

            assert.match(markup, /<h1 class="title">Hello SSR<\/h1>/);
            assert.equal(markup.match(/class="item"/g)?.length, 3);
            assert.match(markup, />alpha<\/li>/);
            assert.match(markup, /data-count="3"/);
        });

        it('serializes the value an activity effect settled on synchronously', () => {
            const count = activity(1);
            const Counter = component(
                (html) => html`
                    <p>count: ${count.effect(({ value }) => String(value))}</p>
                `
            );

            count.update(42);

            const markup = renderToStringSync(Counter(), {
                window: createWindow()
            });

            assert.match(markup, /count: 42/);
        });

        it('isolates sequential renders with different windows', () => {
            const App = component(
                (html, { heading }) => html`
                    <h1>${heading}</h1>
                `
            );
            const markupA = renderToStringSync(
                App({ heading: 'first render' }),
                { window: createWindow() }
            );
            const markupB = renderToStringSync(
                App({ heading: 'second render' }),
                { window: createWindow() }
            );

            assert.match(markupA, /first render/);
            assert.doesNotMatch(markupA, /second render/);
            assert.match(markupB, /second render/);
            assert.doesNotMatch(markupB, /first render/);
        });

        it('restores the outer render scope around a nested render (interleaving safety)', () => {
            const Inner = component(
                (html) => html`
                    <em>inner</em>
                `
            );
            let innerMarkup = '';
            // A component that kicks off a whole other render mid-render — the
            // worst-case interleaving a synchronous scope must survive.
            const Outer = component((html) => {
                innerMarkup = renderToStringSync(Inner(), {
                    window: createWindow()
                });
                return html`
                    <section>outer content</section>
                `;
            });

            const outerMarkup = renderToStringSync(Outer(), {
                window: createWindow()
            });

            assert.match(innerMarkup, /<em>inner<\/em>/);
            assert.match(outerMarkup, /outer content/);
            assert.doesNotMatch(outerMarkup, /inner/);
        });

        it('fires created but suppresses mounted on the server', () => {
            let createdFired = 0;
            let mountedFired = 0;
            const App = component((html, { onCreated, onMounted }) => {
                onCreated(() => createdFired++);
                onMounted(() => mountedFired++);
                return html`
                    <div>life-cycles</div>
                `;
            });

            renderToStringSync(App(), { window: createWindow() });

            assert.equal(createdFired, 1);
            assert.equal(mountedFired, 0);
        });

        it('applies defineElement registrations to each injected window', () => {
            defineElement(
                'ssr-badge',
                (html, { children }) => html`
                    <span class="badge">${children}</span>
                `
            );

            const Host = component(
                (html) => html`
                    <div><ssr-badge>hi</ssr-badge></div>
                `
            );
            // Two renders, two windows — each has its own registry to satisfy.
            const first = renderToStringSync(Host(), {
                window: createWindow()
            });
            const second = renderToStringSync(Host(), {
                window: createWindow()
            });

            assert.match(first, /<span class="badge">hi<\/span>/);
            assert.match(second, /<span class="badge">hi<\/span>/);
        });

        it('renders a custom element with a $-prefixed interpolated prop under spec-strict attribute validation', () => {
            // The matrix reproducer (server-dom-compat D1): lenient DOMs
            // tolerate an empty-name `setAttribute`; Happy DOM rejects it
            // with InvalidCharacterError.
            defineElement(
                'ssr-card',
                (html, { title }) => html`
                    <div class="card">${title}</div>
                `
            );

            const Host = component(
                (html, { title }) => html`
                    <section><ssr-card $title=${title}></ssr-card></section>
                `
            );
            const markup = renderToStringSync(Host({ title: 'strict' }), {
                window: createWindow()
            });

            assert.match(markup, /<div class="card">strict<\/div>/);
        });

        it('exposes the request url through location for route-aware rendering', () => {
            const Pathname = component(
                (html, { pathname }) => html`
                    <p>path: ${pathname}</p>
                `
            );
            // `locationEffect` reads the injected location lazily.
            const App = component(
                (html) => html`
                    <div>
                        ${locationEffect(({ value: location }) =>
                            Pathname({ pathname: location.pathname })
                        )}
                    </div>
                `
            );

            const markup = renderToStringSync(App(), {
                url: 'https://example.com/docs/intro?q=1',
                window: createWindow()
            });

            assert.match(markup, /path: \/docs\/intro/);
        });
    });
};
