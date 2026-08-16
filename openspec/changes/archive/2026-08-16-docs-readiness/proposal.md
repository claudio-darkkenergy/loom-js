# docs-readiness

## Why

The next planned work is building out the docs pages in `apps/loom`, and two small core gaps will surface immediately in that work: hash/anchor navigation does nothing (table-of-contents links, "copy link to heading" deep links, and initial-load `#fragment` scrolls are all broken under the SPA router), and attribute values of `0` are silently dropped (`tabindex={0}`, `min={0}`, `value={0}` remove the attribute instead of rendering it). Both fixes are narrow and well-understood; landing them first makes the docs work exercise them end to end.

## What Changes

- **Hash/anchor navigation in the Router.** Today `route()` calls `preventDefault()` unconditionally and `didRouteChange` deliberately ignores `hash`, so a hash-only navigation updates the URL via `pushState` and then does nothing — no scroll, and the browser's native anchor jump is suppressed. (Anchor handling was last present as the `onHash` callback removed in `da64ade`; the new window-keyed Router never had it.) Add hash-aware handling:
    - Same-page hash navigation scrolls the anchor target into view.
    - Cross-page navigation carrying a hash scrolls after the routed page content renders.
    - Initial page load with a `#fragment` scrolls after the first routed render (native scroll fires before lazy content exists).
    - Hash-only navigations continue to NOT re-run route matching or page loads — the `didRouteChange` gate and the layered-pipeline semantics are untouched.
- **Zero-value attribute fix.** The two falsy gates in `get-attr-update.ts` (the attr-slot path and the `$attrs` entry path) test `!Boolean(value)` and remove the attribute for the legitimate value `0`. Align them with the text path, which already preserves zero (`resolve-value.ts`): remove the attribute only when the resolved value is falsy _and not `0`_; `0` renders as `"0"` (or the value prop, for `value`). `false`, `null`, `undefined`, `''`, and `NaN` continue to remove the attribute.

## Capabilities

### New Capabilities

- `attr-value-semantics`: How resolved template tag values map to attribute presence/absence — falsy values remove the attribute (supporting boolean attributes), with `0` explicitly exempted and rendered; text interpolation's existing zero-preservation is captured alongside for symmetry. No existing spec owns this behavior today.

### Modified Capabilities

- `spa-routing`: New requirement — hash navigations scroll to their anchor target (same-page, cross-page, and initial-load cases) without re-running route matching or page loads, and without disturbing the native-intent fallthrough policy.

## Impact

- `packages/core/src/router.ts` — `route()` gains the hash branch; the Router gains a deferred anchor-scroll for cross-page/initial-load cases.
- `packages/core/src/lib/templating/get-attr-update.ts` — both falsy gates (attr-slot path and `applyAttrsEntry`); the three `@TODO Handle number zero` comments resolve.
- Tests: `packages/core/tests/unit/` — new/extended specs for route hash behavior and attr zero handling (TDD workflow applies).
- Specs: new `openspec/specs/attr-value-semantics/spec.md`; delta on `openspec/specs/spa-routing/spec.md`.
- No public API surface changes; no breaking changes. One `@loom-js/core` patch/minor changeset.
