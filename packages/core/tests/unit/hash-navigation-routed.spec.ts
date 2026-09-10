import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity, component, createRoutes, route } from '../../src';
import type { ContextFunction } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for the router's navigation-scroll contract (`route-scroll-option`):
// navigations that change the route consume their scroll — a fragment's
// anchor once the settlement signal resolves (so anchors produced by tracked
// async work — route chunks, data fetched through activity transforms — exist
// for the single attempt), or the top immediately for a fragmentless
// navigation (a top scroll has no target to wait for).
// `{ scroll: false }` suppresses every scroll of the navigation. The router
// owns scroll restoration (`settlement-scroll-restoration`): offsets capture
// onto the entry at exit and replay after settlement on traversal/reload;
// entries with no captured offset traverse scroll-free.
//
// Test order matters: the router singleton is constructed on first routing
// use, so the initial-load spec must own that first use — with the boot
// fragment already in the URL — and the never-settling fixture must run last
// (it pins the window's pending count above zero for good).

// Mimics a data-driven page: the anchor target renders from a tracked async
// transform, kicked off by the route's importer — so the target exists only
// after settlement, never at first-render time.
const makeAsyncAnchorActivity = () =>
    activity<string | undefined, string>(
        undefined,
        async ({ input, update }) => {
            await new Promise((resolve) => setTimeout(resolve, 40));
            update(input);
        }
    );

const bootAnchorActivity = makeAsyncAnchorActivity();
const lateAnchorActivity = makeAsyncAnchorActivity();
// Never settles — pins the pending count so only the bounded wait can fire.
const stuckActivity = activity<string>(
    'initial',
    () => new Promise<void>(() => {})
);

const HomePage = component(
    (html) => html`
        <div>
            ${bootAnchorActivity.effect(({ value: anchorId }) =>
                anchorId
                    ? AnchorTarget({ anchorId })
                    : 'home content loading...'
            )}
        </div>
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
const LatePage = component(
    (html) => html`
        <div>
            ${lateAnchorActivity.effect(({ value: anchorId }) =>
                anchorId
                    ? AnchorTarget({ anchorId })
                    : 'late content loading...'
            )}
        </div>
    `
);
const StuckPage = component(
    (html) => html`
        <div id="stuck-anchor">stuck content</div>
    `
);
const AnchorTarget = component<{ anchorId: string }>(
    (html, { anchorId }) => html`
        <div id=${anchorId}>tracked async content</div>
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
    let scrollToFake: sinon.SinonSpy;

    before(() => {
        scrollIntoViewFake = sinon.replace(
            Element.prototype,
            'scrollIntoView',
            sinon.fake()
        );
        scrollToFake = sinon.replace(window, 'scrollTo', sinon.fake());

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

    it('scrolls to a tracked-async boot fragment once settled on the initial load', async () => {
        const Routes = createRoutes({
            config: {
                [homePathname]: () => {
                    bootAnchorActivity.update('boot-anchor');
                    return Promise.resolve({ default: HomePage });
                },
                '/hash-docs': () => Promise.resolve({ default: DocsPage }),
                '/hash-late': () => {
                    lateAnchorActivity.update('late-anchor');
                    return Promise.resolve({ default: LatePage });
                },
                '/hash-section/:name': () =>
                    Promise.resolve({ default: SectionPage }),
                '/hash-stuck': () => {
                    stuckActivity.update('never-lands');
                    return Promise.resolve({ default: StuckPage });
                }
            }
        });

        await runSetup({
            containerProps: {
                // The routes component only yields `undefined` before its
                // effect registers — never in this render path.
                TestComponent: () => Routes({}) as ContextFunction
            }
        });
        // The anchor does not exist at first-render time — only the settled
        // attempt can find it.
        expect(document.getElementById('boot-anchor')).to.be.null;
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(document.getElementById('boot-anchor')),
            'scrolled the tracked-async boot anchor'
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

    it('scrolls a tracked-async anchor once settled on a cross-page navigation', async () => {
        scrollIntoViewFake.resetHistory();

        route(null, { href: '/hash-late#late-anchor' });
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(document.getElementById('late-anchor')),
            'scrolled the tracked-async late anchor'
        ).to.be.true;
    });

    it('no-ops silently when the target never appears, staying single-attempt', async () => {
        scrollIntoViewFake.resetHistory();

        route(null, { href: '/hash-docs#nowhere' });
        await waitFor(() => document.getElementById('docs-anchor') !== null);
        await settle();

        expect(scrollIntoViewFake.called, 'no scroll attempted').to.be.false;

        // A later navigation is unaffected by the missed attempt.
        route(null, { href: '/hash-section/alpha#section-anchor' });
        await waitFor(() => scrollIntoViewFake.called);

        expect(
            scrollIntoViewFake.calledOn(
                document.getElementById('section-anchor')
            )
        ).to.be.true;
    });

    it('scrolls after a same-matched-route (param) navigation with a hash', async () => {
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

    it('scrolls a fragmentless navigation to the top, instantly, after render', async () => {
        scrollToFake.resetHistory();
        scrollIntoViewFake.resetHistory();

        route(null, { href: '/hash-docs' });
        await waitFor(() => scrollToFake.called);

        expect(
            scrollToFake.calledWithMatch({
                behavior: 'instant',
                left: 0,
                top: 0
            }),
            'scrolled to the top without animation'
        ).to.be.true;
        expect(scrollIntoViewFake.called, 'no anchor scroll').to.be.false;
    });

    it('keeps the viewport still on an opted-out fragmentless navigation', async () => {
        scrollToFake.resetHistory();

        route(null, { href: `${homePathname}${homeSearch}`, scroll: false });
        await settle();

        expect(scrollToFake.called, 'no top scroll').to.be.false;
    });

    it('performs no scroll of its own on a popstate traversal', async () => {
        scrollToFake.resetHistory();
        scrollIntoViewFake.resetHistory();

        await new Promise((resolve) => {
            window.addEventListener('popstate', resolve, { once: true });
            window.history.back();
        });
        await settle();

        expect(scrollToFake.called, 'no top scroll').to.be.false;
        expect(scrollIntoViewFake.called, 'no anchor scroll').to.be.false;
    });

    it('owns scroll restoration for the routing window', () => {
        expect(window.history.scrollRestoration).to.equal('manual');
    });

    it('replays a captured offset on traversal, after settlement', async () => {
        // Park the current entry at a fake depth so the router captures it
        // on the way out (capture reads `scrollY` at push time).
        const scrollYDescriptor = Object.getOwnPropertyDescriptor(
            window,
            'scrollY'
        );

        Object.defineProperty(window, 'scrollY', {
            configurable: true,
            get: () => 777
        });
        route(null, { href: '/hash-docs' });
        await settle();

        // Restore the real scrollY before the traversal back.
        if (scrollYDescriptor) {
            Object.defineProperty(window, 'scrollY', scrollYDescriptor);
        } else {
            delete (window as { scrollY?: number }).scrollY;
        }

        scrollToFake.resetHistory();
        scrollIntoViewFake.resetHistory();
        await new Promise((resolve) => {
            window.addEventListener('popstate', resolve, { once: true });
            window.history.back();
        });
        await settle();
        await waitFor(() => scrollToFake.called);

        expect(
            scrollToFake.calledWithMatch({
                behavior: 'instant',
                left: 0,
                top: 777
            }),
            'restored the captured offset exactly'
        ).to.be.true;
        expect(scrollIntoViewFake.called, 'no anchor scroll').to.be.false;

        // Clean the captured offset off the entry so later traversal specs
        // stay scroll-free, and return to the pre-spec entry.
        window.history.replaceState({}, '');
        route(null, { href: '/hash-docs' });
        await settle();
        scrollToFake.resetHistory();
    });

    it('renders a cross-page navigation with a hash but no scroll when opted out', async () => {
        route(null, { href: `${homePathname}${homeSearch}` });
        await settle();
        scrollToFake.resetHistory();
        scrollIntoViewFake.resetHistory();

        route(null, {
            href: '/hash-section/opt#section-anchor',
            scroll: false
        });
        await waitFor(() => document.getElementById('section-anchor') !== null);
        await settle();

        expect(scrollIntoViewFake.called, 'no deferred anchor scroll').to.be
            .false;
        expect(scrollToFake.called, 'no top scroll').to.be.false;
    });

    it('fires the deferred scroll at the settlement bound when a page never settles', async function () {
        this.timeout(10000);
        scrollIntoViewFake.resetHistory();

        // The stuck route's importer pins the pending count above zero, so
        // settlement never resolves — only the bounded wait can release the
        // single scroll attempt.
        route(null, { href: '/hash-stuck#stuck-anchor' });
        await waitFor(() => scrollIntoViewFake.called, 6000);

        expect(
            scrollIntoViewFake.calledOn(
                document.getElementById('stuck-anchor')
            ),
            'scrolled once the bound expired'
        ).to.be.true;
    });
});
