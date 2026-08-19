# improve-loom-console — proposal

## Why

`loomConsole` (the framework's debug console) has three defects that undercut its purpose. Every message is attributed to the proxy wrapper in `loom-console.ts` instead of the code that logged it, so DevTools line references are useless. The proxy gates _every_ method behind `canDebug('console')` — including `warn`/`error` — so framework warnings users are meant to see (the `hydrate`/`renderToString` `maxWait` expiry warnings, attr misuse warnings) are silent unless the app has opted into debug logging, which inverts what a warning is for. And when debug _is_ on, hot-path logs flood the console (652 "should update" lines on one docs-app page load), drowning the signal the flag was enabled to find.

## What Changes

- `loomConsole` returns bound native console methods (`method.bind(console)`) when the relevant gate is open, and a no-op when closed — restoring true call-site attribution in DevTools and dropping the per-call wrapper closure.
- `warn` and `error` bypass the debug gate entirely: framework warnings and errors always surface, in development and production alike. Call sites drop their `canDebug('warn') &&` prefixes.
- The `console` debug scope's double-gate is removed: each call site is gated once, by its own scope (`updates`, `mutations`, `activity`, `creation`), not additionally by a global `console` scope. The `console`, `warn`, and `error` entries leave `ConfigDebugAllowable`. **BREAKING** for consumers of `setDebug` types (pre-1.0 core; minor changeset per repo convention).
- Hot-path debug logs are tamed: the per-update "should update" log in `set-reactive-updates.ts` is demoted to a collapsed-group/summary form consistent with the `mutations` scope's existing grouping, so enabling `updates` narrates render cycles without one line per reconciled value.

## Capabilities

### New Capabilities

- `diagnostic-logging`: the framework's console surface — always-on warnings/errors with call-site attribution, scoped opt-in debug channels, silence by default, and zero overhead beyond a gate check when channels are off.

### Modified Capabilities

- `server-rendering`: the `maxWait` expiry warning is no longer debug-gated — it always surfaces (the scenario currently specifies "debug-gated, as `hydrate`'s expiry warning is").

## Impact

- `packages/core/src/lib/globals/loom-console.ts` — proxy rework.
- `packages/core/src/config.ts` + `types` — `ConfigDebugAllowable` shrinks; `canDebug` unchanged in shape.
- Call sites: `get-attr-update.ts` (5 warn sites), `set-reactive-updates.ts`, `life-cycles.ts`, `html-parser.ts`, `hydrate.ts`, `dehydrate.ts`, `server.ts`, `bootstrap.ts`.
- Specs: new `diagnostic-logging` spec; delta to `server-rendering`.
- Consumers: apps relying on debug-off silence keep it for info/debug channels; they newly see genuine warnings (intended).
