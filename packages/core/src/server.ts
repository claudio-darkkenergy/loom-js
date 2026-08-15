// Server render entry — `@loom-js/core/server`. Renders a loom app against an
// injected DOM implementation (e.g. a linkedom `parseHTML` window) through the
// exact same code path the browser uses, and returns the serialized markup.
// loom never imports the DOM implementation itself; the caller supplies it,
// which keeps this entry dependency-free and the browser bundle untouched.
import { _lifeCycles } from './lib/context/life-cycles';
import { DomWindow, withWindow } from './lib/dom';
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
     * (`createRoutes`, `router`) sees the requested path. When omitted, an
     * existing `location` is kept, or a localhost placeholder is installed.
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
 * Renders a loom app to an HTML string against an injected DOM — the same
 * render path the browser runs, so server and client markup cannot drift.
 *
 * The render is synchronous: what has rendered when the app's synchronous work
 * completes is what serializes. Mount life-cycles (`onMounted`/`onUnmounted`)
 * never fire here — they belong to a live, observed browser document.
 *
 * ```ts
 * import { parseHTML } from 'linkedom';
 * import { renderToString } from '@loom-js/core/server';
 *
 * const { window } = parseHTML('<html><body></body></html>');
 * const html = renderToString(App(props), { window, url: request.url });
 * ```
 *
 * @param app The app's `ContextFunction` (a called `Component`).
 * @param options See `RenderToStringOptions`.
 * @returns The rendered markup — the injected document body's `innerHTML`.
 */
export const renderToString = (
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
