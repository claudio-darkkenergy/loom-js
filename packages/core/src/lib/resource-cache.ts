// Per-window state behind the keyed resource cache (`resource`,
// `primeResources`) and its server-side capture (`dehydrate`). Keyed by the
// provider window (settlement precedent) so concurrent server renders cannot
// cross-talk and a render's cache is garbage-collected with its window.
import { DomWindow } from './dom';

export interface ResourceCacheEntry {
    promise: Promise<unknown>;
    /** `true` once the fetch resolved — only settled values dehydrate. */
    settled: boolean;
    value: unknown;
}

/** The dehydrated form: settled resource values keyed by resource key. */
export type DehydratedState = Record<string, unknown>;

const resourceCaches = new WeakMap<
    DomWindow,
    Map<string, ResourceCacheEntry>
>();

/**
 * Resolves `win`'s resource cache, creating it on first access.
 */
export const getResourceCache = (
    win: DomWindow
): Map<string, ResourceCacheEntry> => {
    let cache = resourceCaches.get(win);

    if (!cache) {
        cache = new Map();
        resourceCaches.set(win, cache);
    }

    return cache;
};

/**
 * Resolves `win`'s resource cache without creating one — the read path for
 * `dehydrate`, where an absent cache just means nothing was fetched.
 */
export const peekResourceCache = (
    win: DomWindow
): Map<string, ResourceCacheEntry> | undefined => resourceCaches.get(win);
