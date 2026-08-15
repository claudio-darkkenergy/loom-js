// The render-scoped DOM provider seam. Rendering resolves `window`/`document`
// (and every constructor it `instanceof`-checks) through these accessors
// instead of bare globals, so a server render can point the same code path at
// an injected DOM implementation (e.g. linkedom) without forking it.
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
