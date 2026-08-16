import { whenSettled } from './lib/settlement';

/**
 * Resolves once no framework-mediated async work is pending for the current
 * window — every thenable returned by an activity transform (lazy imports,
 * page-route imports, async data transforms) has settled, confirmed by one
 * macrotask of continued quiet so chained async work is awaited to
 * quiescence. An app with no async work resolves after at most one macrotask.
 *
 * Async work that never passes through an activity transform (a raw `fetch`
 * inside a `watch` callback, a `setTimeout`) is invisible to this signal —
 * see `hydrate`'s `ready` option for the caller-owned gate.
 */
export const settled = (): Promise<void> =>
    new Promise((resolve) => whenSettled(resolve));
