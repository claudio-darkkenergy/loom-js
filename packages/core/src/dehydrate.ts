// Server-side capture for the dehydrated-state handoff: read a render's
// settled resource values so the page can embed them and the client can prime
// its cache (`primeResources`) instead of re-running the fetches.
import { DomWindow } from './lib/dom';
import { loomConsole } from './lib/globals/loom-console';
import { DehydratedState, peekResourceCache } from './lib/resource-cache';

export type { DehydratedState };

// `true` when `value` survives a `JSON.stringify`/`parse` round-trip —
// `stringify` throws on circular/BigInt values and returns `undefined` for
// functions/symbols/`undefined`, and neither can be embedded in a page.
const isSerializable = (value: unknown): boolean => {
    try {
        return JSON.stringify(value) !== undefined;
    } catch {
        return false;
    }
};

/**
 * Captures a render's settled resource values as a plain JSON-serializable
 * object — call it after `await renderToString(app, { window, url })`, with
 * the same window. Pending entries (possible when the render's drain bound
 * expired) are skipped; so are entries whose values cannot be
 * JSON-serialized — on the client a skipped key is just a cache miss, so the
 * page still works, it just fetches.
 *
 * @param win The window the render ran against.
 * @returns Settled resource values keyed by resource key.
 */
export const dehydrate = (win: object): DehydratedState => {
    const state: DehydratedState = {};
    const cache = peekResourceCache(win as DomWindow);

    cache?.forEach(({ settled, value }, key) => {
        if (!settled) {
            return;
        }

        if (!isSerializable(value)) {
            loomConsole.warn(
                `[loom] dehydrate: skipping "${key}" — its value cannot be JSON-serialized, so the client will fetch it instead.`
            );

            return;
        }

        state[key] = value;
    });

    return state;
};

/**
 * Serializes a dehydrated state object to a JSON string safe to inline
 * inside an HTML script element — the sequences that could terminate the
 * element or break parsing (`<`, U+2028, U+2029) are escaped, and
 * `JSON.parse` of the output reproduces the original state. Hand-rolling
 * `JSON.stringify` into inline HTML is a known XSS footgun (`</script>`
 * smuggled through content) — always embed through this helper:
 *
 * ```ts
 * const embed = `<script type="application/json" id="loom-state">${serializeState(state)}</script>`;
 * ```
 *
 * @param state The dehydrated state (see `dehydrate`).
 * @returns The script-safe JSON string.
 */
export const serializeState = (state: DehydratedState): string =>
    JSON.stringify(state)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
