# improve-loom-console — design

## Context

`loomConsole` (`src/lib/globals/loom-console.ts`) proxies `globalThis.console`: every method access returns a fresh wrapper closure that forwards only when `canDebug('console')` is true. It is exposed to apps as `loom.console` via `bootstrap.ts`. Three consequences observed in the docs app:

- DevTools attributes every message to the wrapper's line in the core bundle, not the logging call site.
- `warn`/`error` are behind the same gate, and each warn call site adds a second gate (`canDebug('warn') &&`). With `debug` defaulting to `false`, framework warnings — `hydrate`/`renderToString` `maxWait` expiry, attr misuse in `get-attr-update.ts` — never surface unless an app calls `setDebug()`.
- With debug on, the per-value "should update" log in `set-reactive-updates.ts` emits one flat line per reactive value per cycle (652 on one docs-app page load), unlike the render/mount/mutation narration which already collapses into `groupCollapsed` sections.

`canDebug(scope)` = `NODE_ENV !== 'production' && debug && debug[scope]`. Scopes today: `activity`, `console`, `creation`, `error`, `mutations`, `updates`, `warn`.

## Goals / Non-Goals

**Goals:**

- Console messages attribute to the real call site in DevTools.
- Framework warnings and errors always surface — dev and production, no opt-in.
- Debug channels stay opt-in, scoped, and silent by default, with hot-path narration collapsed rather than flat.
- No new API surface for call sites: they keep calling `loomConsole.<method>(…)`.

**Non-Goals:**

- No log-level system, formatter, transport, or external logger integration (zero-dependency rule).
- No changes to what the `mutations`/`creation`/`activity` narration says — only how `updates` narration is grouped.
- No app-facing logger API; `loom.console` remains an internal surface that happens to be inspectable.

## Decisions

**1. Return bound natives (or a shared no-op) from the proxy `get` — no wrapper closures.**
Property access happens on every call-site invocation, so the gate can be evaluated at access time: open → `value.bind(target)`, closed → a shared `noop`. A bound native console method reports the _caller's_ frame in DevTools, which restores attribution; a wrapper function cannot. This also deletes the `this === receiver` juggling and the per-access closure allocation. Alternative considered: keeping a wrapper but using `Error.captureStackTrace`-style rewriting — non-portable, and still lies to the DevTools source link.

**2. `warn` and `error` bypass every gate, including `NODE_ENV`.**
The proxy special-cases the two methods and always returns the bound native. Warnings exist for consumers who have _not_ opted into anything (the `maxWait` expiry warning is load-bearing for SSG runs, which typically execute with `NODE_ENV=production`). Call sites drop their `canDebug('warn') &&` prefixes; the `warn`/`error` scopes leave `ConfigDebugAllowable`. Alternative considered: always-on in dev only — rejected because the server-render expiry warning is most valuable in production builds.

**3. Single-gate: the proxy checks "debug is on at all"; call sites keep per-scope guards.**
The `console` scope is deleted. For non-warn/error methods the proxy's gate becomes "is `debug` truthy in non-production" (any scope enabled), and granularity stays where it already lives — the call-site `canDebug('updates') && …` guards. The proxy cannot know which scope a call site belongs to without a new API, and inventing one (`loomConsole.for('updates')`) churns every call site for no behavioral gain. The convention "every info/group call site carries its own scope guard" is enforced by the existing code shape and the spec.

**4. Collapse reactive-update narration.**
The `should update` log moves under a `groupCollapsed` per reactive effect run (mirroring the `loom (Updating…)`/`loom (Mounting…)` groups in `html-parser.ts` and `life-cycles.ts`), keeping the per-value detail available but folded. No sampling or throttling — DevTools collapse is the framework's established answer to narration volume.

## Risks / Trade-offs

- [Apps that relied on total silence with debug off will now see framework warnings] → intended behavior; warnings are actionable (attr misuse, settlement expiry). Changeset calls it out.
- [Access-time gating means a captured method reference (`const log = loomConsole.info`) freezes its gate state] → framework call sites always access at call time; documented as the contract.
- [`ConfigDebugAllowable` shrinks (`console`/`warn`/`error` gone) — type-level break for `setDebug` callers] → pre-1.0 core; minor changeset per repo convention; runtime tolerates unknown keys.
- [Always-on `error` could double-report where code both logs and throws] → sweep call sites during implementation; log-then-throw sites keep only the throw.

## Open Questions

None — decisions above are settled unless review says otherwise.
