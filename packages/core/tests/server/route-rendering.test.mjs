// Route-aware server rendering (`unify-routing`): module-scope `createRoutes`
// import safety, url-driven route matching, per-window router isolation, and
// the async `renderToString` draining lazily-imported page content. Runs in
// Node
// against the built `dist/` entries — see render-to-string.test.mjs for why.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

// Importing an app whose `createRoutes` runs at module scope IS the first
// assertion — registration must be DOM-free (this import used to throw).
const { App } = await import('./fixtures/module-scope-routes.mjs');
const { component, watchRoute } = await import('../../dist/index.mjs');
const { renderToString, renderToStringSync } =
    await import('../../dist/server.mjs');

const createWindow = () =>
    parseHTML('<!doctype html><html><head></head><body></body></html>').window;

// Renders nothing of interest — exists to observe the matched route from
// inside a render scope via `watchRoute`.
const RouteProbe = component((html, { onRouteValue }) => {
    watchRoute(({ value: routeValue }) => onRouteValue(routeValue));

    return html`
        <span>probe</span>
    `;
});

describe('route-aware server rendering', () => {
    it('imports a module-scope createRoutes app off-browser without throwing', () => {
        assert.equal(typeof App, 'function');
    });

    it('matches the route derived from the request url (observable via watchRoute)', () => {
        const observedRouteValues = [];

        renderToStringSync(
            RouteProbe({
                onRouteValue: (routeValue) =>
                    observedRouteValues.push(routeValue)
            }),
            { url: 'https://example.com/about', window: createWindow() }
        );

        const lastRouteValue = observedRouteValues.at(-1);

        assert.equal(lastRouteValue?.matchedRoute, '/about');
        assert.equal(lastRouteValue?.pathname, '/about');
    });

    it('resolves independent routers & routes for two windows/urls', () => {
        const observedByFirst = [];
        const observedBySecond = [];

        renderToStringSync(
            RouteProbe({
                onRouteValue: (routeValue) =>
                    observedByFirst.push(routeValue.pathname)
            }),
            { url: 'https://example.com/about', window: createWindow() }
        );
        renderToStringSync(
            RouteProbe({
                onRouteValue: (routeValue) =>
                    observedBySecond.push(routeValue.pathname)
            }),
            { url: 'https://example.com/', window: createWindow() }
        );

        assert.equal(observedByFirst.at(-1), '/about');
        assert.equal(observedBySecond.at(-1), '/');
        // Neither render's watcher observed the other's location.
        assert.ok(!observedByFirst.includes('/'));
        assert.ok(!observedBySecond.includes('/about'));
    });

    it('serializes lazily-imported route content via the async renderToString', async () => {
        const markup = await renderToString(App({}), {
            url: 'https://example.com/about',
            window: createWindow()
        });

        assert.match(markup, /about page at \/about/);
    });

    it('stays inert for a fragment-carrying url (hash scrolling off-browser)', async () => {
        // A `#fragment` in the request url arms the router's pending anchor
        // scroll; a provider DOM without CSSOM view APIs (`scrollIntoView`,
        // `requestAnimationFrame`) must consume it as a silent no-op.
        const markup = await renderToString(App({}), {
            url: 'https://example.com/about#section-anchor',
            window: createWindow()
        });

        assert.match(markup, /about page at \/about/);
    });

    it('keeps concurrent async renders isolated (queued scopes)', async () => {
        const [aboutMarkup, homeMarkup] = await Promise.all([
            renderToString(App({}), {
                url: 'https://example.com/about',
                window: createWindow()
            }),
            renderToString(App({}), {
                url: 'https://example.com/',
                window: createWindow()
            })
        ]);

        assert.match(aboutMarkup, /about page at \/about/);
        assert.doesNotMatch(aboutMarkup, /home page/);
        assert.match(homeMarkup, /home page/);
        assert.doesNotMatch(homeMarkup, /about page/);
    });

    it('renderToStringSync stays synchronous: a route-table app serializes the shell', () => {
        const markup = renderToStringSync(App({}), {
            url: 'https://example.com/about',
            window: createWindow()
        });

        // The matched page arrives through an async importer, which cannot
        // settle inside the synchronous pass — the documented fallback is the
        // shell without the page content (use the async renderToString).
        assert.match(markup, /<main>/);
        assert.doesNotMatch(markup, /about page/);
    });
});
