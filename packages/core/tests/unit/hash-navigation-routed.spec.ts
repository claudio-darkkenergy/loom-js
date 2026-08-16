import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component, createRoutes, route } from '../../src';
import type { ContextFunction } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for deferred hash/anchor scrolling (`docs-readiness` design D3):
// navigations that change the route consume their fragment after the routed
// page content renders — including the initial load, whose native anchor
// scroll fires before lazily-imported content exists — and a subsequent
// navigation overwrites any unconsumed pending fragment.
//
// Test order matters: the router singleton is constructed on first routing
// use, so the initial-load spec must own that first use — with the boot
// fragment already in the URL.

const HomePage = component(
    (html) => html`
        <div id="boot-anchor">home content</div>
    `
);
const DocsPage = component(
    (html) => html`
        <div id="docs-anchor">docs content</div>
    `
);
const SectionPage = component(
    (html) => html`
        <div id="section-anchor">section content</div>
    `
);

const waitFor = async (predicate: () => boolean, timeoutMs = 2000) => {
    const start = Date.now();

    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('Timed out waiting on a predicate.');
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('hash navigation (routed, deferred scroll)', () => {
    const originalHref = window.location.href;
    const homePathname = window.location.pathname;
    const homeSearch = window.location.search;
    let scrollIntoViewFake: sinon.SinonSpy;

    before(() => {
        scrollIntoViewFake = sinon.replace(
            Element.prototype,
            'scrollIntoView',
            sinon.fake()
        );

        // The boot fragment must be in the URL before the router singleton is
        // constructed (first routing use, inside the first spec's render).
        window.history.replaceState(
            {},
            '',
            `${homePathname}${homeSearch}#boot-anchor`
        );
    });

    after(() => {
        sinon.restore();
        window.history.replaceState({}, '', originalHref);
    });

    it('scrolls to the boot fragment after the first routed render', async () => {
        const Routes = createRoutes({
            config: {
                [homePathname]: () => Promise.resolve({ default: HomePage }),
                '/hash-docs': () => Promise.resolve({ default: DocsPage }),
                '/hash-section/:name': () =>
                    Promise.resolve({ default: SectionPage })
            }
        });

        await runSetup({
            containerProps: {
                // The routes component only yields `undefined` before its
                // effect registers — never in this render path.
                TestComponent: () => Routes({}) as ContextFunction
            }
        });
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(document.getElementById('boot-anchor')),
            'scrolled the lazily-rendered boot anchor'
        ).to.be.true;
    });

    it('scrolls after render on a cross-page navigation with a hash', async () => {
        scrollIntoViewFake.resetHistory();

        route(null, { href: '/hash-docs#docs-anchor' });
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(document.getElementById('docs-anchor')),
            'scrolled the routed docs anchor'
        ).to.be.true;
    });

    it('scrolls after a same-matched-route (param) navigation with a hash', async () => {
        route(null, { href: '/hash-section/alpha' });
        await waitFor(() => document.getElementById('section-anchor') !== null);
        scrollIntoViewFake.resetHistory();

        // Same matched route, new param — the page import is skipped, but the
        // fragment still owes its scroll.
        route(null, { href: '/hash-section/beta#section-anchor' });
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(
                document.getElementById('section-anchor')
            )
        ).to.be.true;
    });

    it('overwrites an unconsumed pending fragment on the next navigation', async () => {
        scrollIntoViewFake.resetHistory();

        // The second navigation lands before the first route's content —
        // its fragment must not scroll once that content settles.
        route(null, { href: '/hash-docs#docs-anchor' });
        route(null, { href: `${homePathname}${homeSearch}` });
        await settle();

        expect(scrollIntoViewFake.called, 'stale fragment dropped').to.be.false;
    });
});
