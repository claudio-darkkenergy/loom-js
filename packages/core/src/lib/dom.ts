// The render-scoped DOM provider seam. Rendering resolves `window`/`document`
// (and every constructor it `instanceof`-checks) through these accessors
// instead of bare globals, so a server render can point the same code path at
// an injected DOM implementation without forking it.
//
// The swap is synchronous — loom's render pass never awaits, so `withWindow`
// is observationally identical to threading the window through as an argument,
// and overlapping server renders (which interleave only at `await` points)
// can never see each other's window.

export type DomWindow = Window & typeof globalThis;

let currentWindow: DomWindow | undefined =
    typeof window !== 'undefined' ? window : undefined;

/**
 * `true` when a DOM is currently resolvable — the real `window` in a browser,
 * or an injected one inside a `withWindow` scope.
 */
export const hasWindow = () => currentWindow !== undefined;

/**
 * Resolves the current `window`. In a browser this is the real global; on a
 * server it is the window injected for the active render scope.
 */
export const getWindow = (): DomWindow => {
    if (!currentWindow) {
        throw new Error(
            '[loom] No DOM is available. Outside a browser, render through `renderToString(app, { window })` from `@loom-js/core/server`.'
        );
    }

    return currentWindow;
};

/**
 * Resolves the current `document` (see `getWindow`).
 */
export const getDocument = () => getWindow().document;

// Per-window location overrides. Some DOM implementations make `location`
// spec-unforgeable (jsdom), so the server's `url` option cannot always be
// installed onto the window itself — the override carries it instead, and
// loom reads location exclusively through these resolvers.
const locationOverrides = new WeakMap<DomWindow, Location>();

/**
 * Registers `location` as `win`'s effective location for loom's own reads —
 * the server render entries call this with the `url`-derived location-like.
 */
export const setLocationOverride = (win: DomWindow, location: Location) => {
    locationOverrides.set(win, location);
};

/**
 * Resolves `win`'s effective location — the registered override, else the
 * window's own `location`.
 */
export const getLocationOf = (win: DomWindow): Location =>
    locationOverrides.get(win) ?? win.location;

/**
 * Resolves the current window's effective location (see `getWindow`).
 */
export const getLocation = (): Location => getLocationOf(getWindow());

/**
 * Enters `win` as the resolvable window & returns the function that restores
 * the previous one. `withWindow` is the right tool for synchronous scopes;
 * this exists for the async server render, whose settled work (lazy route
 * importers) must still resolve the injected window across `await`
 * boundaries. Callers own the restore & must not overlap two open scopes —
 * the async `renderToString` serializes its renders through a queue for
 * exactly that reason.
 */
export const enterWindow = (win: DomWindow): (() => void) => {
    const previousWindow = currentWindow;

    currentWindow = win;

    return () => {
        currentWindow = previousWindow;
    };
};

/**
 * Runs `fn` with `win` as the resolvable window, restoring the previous
 * window afterward. The scope is synchronous by design — work that settles
 * after `fn` returns resolves against whatever window is current then.
 */
export const withWindow = <T>(win: DomWindow, fn: () => T): T => {
    const previousWindow = currentWindow;

    currentWindow = win;

    try {
        return fn();
    } finally {
        currentWindow = previousWindow;
    }
};
