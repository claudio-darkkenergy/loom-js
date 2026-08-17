// Server render entry — `@loom-js/core/server`. Renders a loom app against an
// injected DOM implementation (e.g. a linkedom `parseHTML` window) through the
// exact same code path the browser uses, and returns the serialized markup.
// loom never imports the DOM implementation itself; the caller supplies it,
// which keeps this entry dependency-free and the browser bundle untouched.
export * from './dehydrate';

import { _lifeCycles } from './lib/context/life-cycles';
import { DomWindow, enterWindow, withWindow } from './lib/dom';
import { mount } from './lib/mount';
import { applyElementRegistrations } from './lib/templating/register-custom-element';
import type { ContextFunction } from './types';

export interface RenderToStringOptions {
    /**
     * The DOM to render against — e.g. `parseHTML(...).window` from linkedom.
     * Must not be shared across concurrent renders. Gaps linkedom leaves
     * (`NodeFilter`, `location`, `history`) are filled in before rendering.
     */
    window: object;
    /**
     * The request URL. Installed as the window's `location` so route matching
     * (`createRoutes`, `locationEffect`) sees the requested path. When
     * omitted, an existing `location` is kept, or a localhost placeholder is
     * installed.
     */
    url?: string;
}

const DEFAULT_URL = 'http://localhost/';

// The `whatToShow` bit-field constants `document.createTreeWalker` consumers
// use — linkedom accepts the numeric values but does not expose the constants
// on its window.
const NODE_FILTER_CONSTANTS = {
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
    FILTER_SKIP: 3,
    SHOW_ALL: 0xffffffff,
    SHOW_ATTRIBUTE: 0x2,
    SHOW_CDATA_SECTION: 0x8,
    SHOW_COMMENT: 0x80,
    SHOW_DOCUMENT: 0x100,
    SHOW_DOCUMENT_FRAGMENT: 0x400,
    SHOW_DOCUMENT_TYPE: 0x200,
    SHOW_ELEMENT: 0x1,
    SHOW_PROCESSING_INSTRUCTION: 0x40,
    SHOW_TEXT: 0x4
};

// A `Location` stand-in with plain own-enumerable fields. A raw `URL` will not
// do: its fields are prototype getters, so the `Object.assign({}, location)`
// snapshots the router takes would come back empty.
const createLocationLike = (url: string) => {
    const parsed = new URL(url);

    return {
        hash: parsed.hash,
        host: parsed.host,
        hostname: parsed.hostname,
        href: parsed.href,
        origin: parsed.origin,
        pathname: parsed.pathname,
        port: parsed.port,
        protocol: parsed.protocol,
        search: parsed.search,
        assign(nextHref: string) {
            Object.assign(this, createLocationLike(nextHref));
        },
        reload() {},
        replace(nextHref: string) {
            Object.assign(this, createLocationLike(nextHref));
        },
        toString() {
            return this.href;
        }
    };
};

// `pushState`/`replaceState` are all the router calls; both just move the
// location-like. Navigation history itself is meaningless within one render.
const createHistoryShim = (win: DomWindow) => {
    const navigate = (url?: string | URL | null) => {
        url != null &&
            Object.assign(
                win.location,
                createLocationLike(String(new URL(url, win.location.href)))
            );
    };

    return {
        back() {},
        forward() {},
        go() {},
        length: 1,
        pushState: (_state: unknown, _unused: string, url?: string | null) =>
            navigate(url),
        replaceState: (_state: unknown, _unused: string, url?: string | null) =>
            navigate(url),
        scrollRestoration: 'auto',
        state: null
    };
};

// Fills the gaps a linkedom window leaves relative to what loom resolves
// through the provider seam.
const normalizeWindow = (win: DomWindow, url?: string) => {
    const looseWin = win as unknown as Record<string, unknown>;

    if (url || !looseWin.location) {
        looseWin.location = createLocationLike(url || DEFAULT_URL);
    }

    if (!looseWin.NodeFilter) {
        looseWin.NodeFilter = NODE_FILTER_CONSTANTS;
    }

    if (!looseWin.history) {
        looseWin.history = createHistoryShim(win);
    }
};

/**
 * The synchronous render primitive: renders a loom app to an HTML string
 * against an injected DOM — the same render path the browser runs, so server
 * and client markup cannot drift.
 *
 * What has rendered when the app's synchronous work completes is what
 * serializes. Content behind async importers (`createRoutes` route pages,
 * `lazyImport`) cannot settle inside a synchronous pass, so route-table apps
 * serialize their shell/fallback here — render those through
 * `renderToString`. Mount life-cycles (`onMounted`/`onUnmounted`) never fire
 * on a server — they belong to a live, observed browser document.
 *
 * ```ts
 * import { parseHTML } from 'linkedom';
 * import { renderToStringSync } from '@loom-js/core/server';
 *
 * const { window } = parseHTML('<html><body></body></html>');
 * const html = renderToStringSync(Fragment(props), { window });
 * ```
 *
 * @param app The app's `ContextFunction` (a called `Component`).
 * @param options See `RenderToStringOptions`.
 * @returns The rendered markup — the injected document body's `innerHTML`.
 */
export const renderToStringSync = (
    app: ContextFunction,
    { url, window: win }: RenderToStringOptions
): string => {
    const domWindow = win as DomWindow;

    normalizeWindow(domWindow, url);

    return withWindow(domWindow, () => {
        try {
            // Registrations made at app-module load had no window to land in,
            // and every injected window has its own registry.
            applyElementRegistrations(domWindow);

            const appCtx = app();
            const { body } = domWindow.document;

            mount(body, appCtx, null);

            return body.innerHTML;
        } finally {
            _lifeCycles.release(domWindow.document);
        }
    });
};

// The drain bound for `renderToString`. Each pass yields a macrotask —
// dynamic `import()` settles beyond the microtask queue — and passes stop
// early once the markup goes quiet between two consecutive passes, so chains
// of lazy content (a page that lazy-loads its own content) each get a turn.
const MAX_DRAIN_PASSES = 10;

// Serializes concurrent async renders: settled work must resolve the injected
// window across `await` boundaries, so exactly one async render scope may be
// open at a time. `renderToStringSync` calls interleave safely — `withWindow`
// restores the open async scope on exit.
let asyncRenderQueue: Promise<void> = Promise.resolve();

const renderSettled = async (
    app: ContextFunction,
    { url, window: win }: RenderToStringOptions
): Promise<string> => {
    const domWindow = win as DomWindow;

    normalizeWindow(domWindow, url);

    const exitWindow = enterWindow(domWindow);

    try {
        applyElementRegistrations(domWindow);

        const appCtx = app();
        const { body } = domWindow.document;

        mount(body, appCtx, null);

        // Drain settled route/lazy-import work: yield until pending importers
        // land and the markup goes quiet (bounded).
        let settledMarkup = body.innerHTML;

        for (let pass = 0; pass < MAX_DRAIN_PASSES; pass++) {
            await new Promise((resolve) => setTimeout(resolve));

            const currentMarkup = body.innerHTML;

            if (currentMarkup === settledMarkup) {
                break;
            }

            settledMarkup = currentMarkup;
        }

        return settledMarkup;
    } finally {
        exitWindow();
        _lifeCycles.release(domWindow.document);
    }
};

/**
 * The go-to server render: renders a loom app to an HTML string — SSR at
 * request time, SSG/prerender at build time — through the exact render path
 * the browser runs, against an injected DOM. Content that arrives through
 * async importers (`createRoutes` route pages, `lazyImport`) is drained until
 * the markup goes quiet (bounded) before serializing, so the matched page
 * content — not the shell/fallback — is what serializes.
 *
 * ```ts
 * import { parseHTML } from 'linkedom';
 * import { renderToString } from '@loom-js/core/server';
 *
 * const { window } = parseHTML('<html><body></body></html>');
 * const html = await renderToString(App(props), { window, url: request.url });
 * ```
 *
 * Concurrent calls are serialized internally: the injected window must stay
 * resolvable across `await` boundaries, so one async render is in flight at a
 * time. For synchronous route-less rendering (fragments, email/OG markup,
 * snapshot tests) use `renderToStringSync`; nesting a synchronous render
 * inside an async one remains safe.
 *
 * @param app The app's `ContextFunction` (a called `Component`).
 * @param options See `RenderToStringOptions`.
 * @returns The rendered markup — the injected document body's `innerHTML`.
 */
export const renderToString = (
    app: ContextFunction,
    options: RenderToStringOptions
): Promise<string> => {
    const chained = asyncRenderQueue.then(() => renderSettled(app, options));

    // Keep the queue alive whether or not this render succeeds.
    asyncRenderQueue = chained.then(
        () => undefined,
        () => undefined
    );

    return chained;
};
