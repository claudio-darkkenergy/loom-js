import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component, createRoutes, init, setDebug } from '../../src';
import type { Component, ContextFunction } from '../../src/types';

const macrotasks = async (count: number) => {
    for (let elapsed = 0; elapsed < count; elapsed++) {
        await new Promise((resolve) => setTimeout(resolve));
    }
};

// Polls until `probe` returns truthy or the bound expires — stylesheet
// load/error timing is the browser's, not the test's.
const waitFor = async (probe: () => unknown, boundMs = 2000) => {
    const started = Date.now();

    while (!probe() && Date.now() - started < boundMs) {
        await macrotasks(1);
    }

    return probe();
};

const stylesheetLinks = (href: string) =>
    document.querySelectorAll(`link[rel="stylesheet"][href="${href}"]`);

const makePage = (marker: string) =>
    component(
        (html) => html`
            <p class=${marker}>routed</p>
        `
    );

const mountRoutes = (routes: ReturnType<typeof createRoutes>) => {
    const root = document.createElement('div');
    const App = component(
        (html, props) => html`
            <main>${routes(props)}</main>
        `
    );

    document.body.append(root);
    init({ app: App() as ContextFunction, root });

    return root;
};

describe('route asset preload', () => {
    afterEach(() => {
        sinon.restore();
        setDebug(false);
        document
            .querySelectorAll('link[href*="asset-spec"]')
            .forEach((link) => link.remove());
        document
            .querySelectorAll('main')
            .forEach((mainEl) => mainEl.parentElement?.remove());
    });

    it('should stay non-breaking without assets, and skip unlisted routes', async () => {
        const Page = makePage('plain-page');
        const routes = createRoutes({
            // Another route's assets must not affect this one.
            assets: { '/elsewhere': ['/asset-spec-unrelated.css'] },
            config: { '/': () => Promise.resolve({ default: Page }) }
        });
        const root = mountRoutes(routes);

        await waitFor(() => root.querySelector('.plain-page'));

        expect(root.querySelector('.plain-page')).to.not.equal(null);
        expect(stylesheetLinks('/asset-spec-unrelated.css').length).to.equal(0);
    });

    it('should inject a declared stylesheet once and render despite its error', async () => {
        const Page = makePage('injected-page');
        const routes = createRoutes({
            assets: { '/': ['/asset-spec-missing.css'] },
            config: { '/': () => Promise.resolve({ default: Page }) }
        });
        const root = mountRoutes(routes);

        // The URL 404s — the error must resolve the wait, not block render.
        await waitFor(() => root.querySelector('.injected-page'));

        expect(root.querySelector('.injected-page')).to.not.equal(null);
        expect(stylesheetLinks('/asset-spec-missing.css').length).to.equal(1);
    });

    it('should start the stylesheet while the chunk import is still pending', async () => {
        const Page = makePage('gated-page');
        const releaseRef: { release?: () => void } = {};
        const routes = createRoutes({
            assets: { '/': ['/asset-spec-concurrent.css'] },
            config: {
                '/': () =>
                    new Promise<{ default: Component }>((resolve) => {
                        releaseRef.release = () => resolve({ default: Page });
                    })
            }
        });
        const root = mountRoutes(routes);

        // The link lands immediately; the content waits on the import.
        await waitFor(
            () => stylesheetLinks('/asset-spec-concurrent.css').length
        );
        expect(root.querySelector('.gated-page')).to.equal(null);

        releaseRef.release?.();
        await waitFor(() => root.querySelector('.gated-page'));
        expect(root.querySelector('.gated-page')).to.not.equal(null);
    });

    it('should treat an already-linked href as loaded, without duplicating it', async () => {
        const shellLink = document.createElement('link');

        shellLink.rel = 'stylesheet';
        shellLink.href = '/asset-spec-shell.css';
        document.head.append(shellLink);

        const Page = makePage('shell-page');
        const routes = createRoutes({
            assets: { '/': ['/asset-spec-shell.css'] },
            config: { '/': () => Promise.resolve({ default: Page }) }
        });
        const root = mountRoutes(routes);

        await waitFor(() => root.querySelector('.shell-page'));

        expect(root.querySelector('.shell-page')).to.not.equal(null);
        expect(stylesheetLinks('/asset-spec-shell.css').length).to.equal(1);
    });

    it('should not re-inject on a repeat render of the same route', async () => {
        const Page = makePage('repeat-page');
        const routes = createRoutes({
            assets: { '/': ['/asset-spec-repeat.css'] },
            config: { '/': () => Promise.resolve({ default: Page }) }
        });

        const firstRoot = mountRoutes(routes);

        await waitFor(() => firstRoot.querySelector('.repeat-page'));

        const secondRoot = mountRoutes(routes);

        await waitFor(() => secondRoot.querySelector('.repeat-page'));

        expect(stylesheetLinks('/asset-spec-repeat.css').length).to.equal(1);
    });

    it('should report a failed stylesheet through debug logging', async () => {
        const infoStub = sinon.stub(globalThis.console, 'info');

        setDebug(true);

        const Page = makePage('logged-page');
        const routes = createRoutes({
            assets: { '/': ['/asset-spec-error.css'] },
            config: { '/': () => Promise.resolve({ default: Page }) }
        });
        const root = mountRoutes(routes);

        await waitFor(() => root.querySelector('.logged-page'));
        await waitFor(() =>
            infoStub
                .getCalls()
                .some((call) => String(call.args[0]).includes('asset'))
        );

        expect(
            infoStub
                .getCalls()
                .some((call) => String(call.args[0]).includes('asset'))
        ).to.equal(true);
    });
});
