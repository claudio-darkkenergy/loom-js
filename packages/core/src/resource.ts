// The keyed resource cache — the interception point dehydration primes.
// Route async data loads through `resource` and a pre-rendered page can hand
// the server's settled values to the client (`dehydrate` on the server,
// `primeResources` at boot), so hydration settles from local data instead of
// re-running the network work.
import { getWindow } from './lib/dom';
import { DehydratedState, getResourceCache } from './lib/resource-cache';

/**
 * Seeds the current window's resource cache from a dehydrated state object —
 * a subsequent `resource` call for a primed key resolves with the primed
 * value without ever invoking its fetcher; unprimed keys fetch exactly as
 * before. Run it before the boot call renders the app (transforms run during
 * first render) — ahead of `hydrate` and `init` alike:
 *
 * ```ts
 * primeResources(readEmbeddedState());
 * hydrate({ app: App(), root });
 * ```
 *
 * @param state The dehydrated state — `dehydrate`'s capture, read back from
 *      wherever the page embedded it.
 */
export const primeResources = (state: DehydratedState): void => {
    const cache = getResourceCache(getWindow());

    Object.entries(state).forEach(([key, value]) => {
        cache.set(key, {
            promise: Promise.resolve(value),
            settled: true,
            value
        });
    });
};

/**
 * Memoizes an async fetch per key, per window: the first call for a key
 * invokes the fetcher, concurrent callers share the in-flight promise, and
 * later calls resolve from the cached result without invoking the fetcher
 * again. A cache, not a reactive value — call it inside an async activity
 * transform (the idiomatic data path), where the returned promise is already
 * tracked by the settlement signal `hydrate` gates on.
 *
 * The cache lives for the window's lifetime (like `lazyImport`) — express
 * freshness through keys (`page:${slug}`), namespaced `<domain>:<id>` to
 * avoid collisions.
 *
 * @param key The cache key.
 * @param fetcher Invoked on a cache miss; its resolved value is cached.
 * @returns The cached, in-flight, or freshly fetched value.
 */
export const resource = <ResourceValue>(
    key: string,
    fetcher: () => Promise<ResourceValue>
): Promise<ResourceValue> => {
    const cache = getResourceCache(getWindow());
    const existing = cache.get(key);

    if (existing) {
        return existing.promise as Promise<ResourceValue>;
    }

    const entry = {
        promise: fetcher().then(
            (value) => {
                entry.settled = true;
                entry.value = value;

                return value;
            },
            (error) => {
                // Rejections are never cached (and so never dehydrated) — a
                // later call retries. Evict only this entry, in case the key
                // was re-seeded while the failure was in flight.
                cache.get(key) === entry && cache.delete(key);

                throw error;
            }
        ),
        settled: false,
        value: undefined as unknown
    };

    cache.set(key, entry);

    return entry.promise;
};
