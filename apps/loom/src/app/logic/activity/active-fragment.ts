import { activity } from '@loom-js/core';

/**
 * The URL fragment the docs view currently sits on, without the `#` — `''`
 * when the URL carries none. Every hash writer (the scroll spy, history
 * traversal, a TOC or copy-link activation) mirrors into it; the TOC
 * indicator binds to it, so the indicator is hash-derived whatever moved
 * the hash.
 */
export const activeFragment = activity('');

/** The window's current fragment, decoded, without the `#`. */
export const readFragment = (win: Window) =>
    decodeURIComponent(win.location.hash.slice(1));

/**
 * Mirrors the current URL fragment into `activeFragment`. Call after a hash
 * write that emits no event — a quiet `pushState`/`replaceState`.
 */
export const syncActiveFragment = (win: Window) =>
    activeFragment.update(readFragment(win));
