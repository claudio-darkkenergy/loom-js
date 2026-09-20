// The keyed resource cache — the interception point dehydration primes.
// Route async data loads through `resource` and a pre-rendered page can hand
// the server's settled values to the client (`dehydrate` on the server,
// `primeResources` at boot), so hydration settles from local data instead of
// re-running the network work.
import { getWindow } from './lib/dom';
import { loomConsole } from './lib/globals/loom-console';
import { STATE_FORMAT_VERSION, getResourceCache } from './lib/resource-cache';
import type { SerializedStateEnvelope } from './types';

// `true` when `payload` is a well-formed envelope of the version this loom
// writes. The signature already says envelope; this catches the untyped
// `JSON.parse` path — exactly where hand-rolled payloads come from. Misuse
// detection, not a security boundary: the serialize-time escaping in
// `serializeState` remains the XSS defense.
const isPrimeablePayload = (payload: SerializedStateEnvelope): boolean => {
    const looseEnvelope = payload as Partial<SerializedStateEnvelope> | null;

    if (
        !looseEnvelope ||
        typeof looseEnvelope !== 'object' ||
        looseEnvelope.__loom === undefined
    ) {
        loomConsole.warn(
            '[loom] primeResources: the payload carries no `__loom` envelope, so it was not produced by `serializeState` — nothing was primed and every key will fetch normally. Embed state through `serializeState` on the server and pass the parsed result here.'
        );

        return false;
    }

    if (
        looseEnvelope.__loom !== STATE_FORMAT_VERSION ||
        !looseEnvelope.state ||
        typeof looseEnvelope.state !== 'object'
    ) {
        loomConsole.warn(
            `[loom] primeResources: state format version ${String(
                looseEnvelope.__loom
            )} is not the version this loom reads (${STATE_FORMAT_VERSION}) — nothing was primed and every key will fetch normally.`
        );

        return false;
    }

    return true;
};

/**
 * Seeds the current window's resource cache from a parsed `serializeState`
 * envelope — a subsequent `resource` call for a primed key resolves with the
 * primed value without ever invoking its fetcher; unprimed keys fetch
 * exactly as before. Run it before the boot call renders the app
 * (transforms run during first render) — ahead of `hydrate` and `init`
 * alike:
 *
 * ```ts
 * primeResources(readEmbeddedState());
 * hydrate({ app: App(), root });
 * ```
 *
 * A payload not produced by `serializeState` — no envelope, or a version
 * this loom doesn't read — primes nothing: one console warning names the
 * problem and the boot proceeds unprimed (every key fetches normally).
 *
 * @param payload The parsed envelope — `serializeState`'s output, read back
 *      from wherever the page embedded it and `JSON.parse`d.
 */
export const primeResources = (payload: SerializedStateEnvelope): void => {
    if (!isPrimeablePayload(payload)) {
        return;
    }

    const cache = getResourceCache(getWindow());

    Object.entries(payload.state).forEach(([key, value]) => {
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
