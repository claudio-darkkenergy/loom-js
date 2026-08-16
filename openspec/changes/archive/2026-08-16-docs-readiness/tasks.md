# docs-readiness — tasks

TDD workflow applies throughout (Red → Green → Refactor): each behavior task lands its failing spec first, then the fix.

## 1. Zero-value attributes (attr-value-semantics)

- [x] 1.1 Red: new unit spec `packages/core/tests/unit/attr-value-semantics.spec.ts` covering the spec scenarios — `tabindex={0}` / `min={0}` render `"0"`; `value={0}` sets the value prop; a `$attrs` entry of `0` renders; `false`/`null`/`undefined`/`''`/`NaN` still remove; `0` in a text slot renders `"0"` (text cases should already pass — pin them).
- [x] 1.2 Green: change both falsy gates in `packages/core/src/lib/templating/get-attr-update.ts` (attr-slot path ~104, `applyAttrsEntry` ~307) to remove only when `!(value || value === 0)`; drop the three `@TODO Handle number zero` comments.
- [x] 1.3 Verify: full core suite (`pnpm -F @loom-js/core test-ci`) — confirm no existing spec relied on zero-removal.

## 2. Hash/anchor navigation (spa-routing)

- [x] 2.1 Red: routing specs for the hash scenarios — same-page hash `route()` call scrolls the target and emits nothing on location/route activities; missing target no-ops; empty `#` scrolls to top; modified-click fallthrough unaffected by a hash href (extend `route-activation.spec.ts`/`location.spec.ts` or add `hash-navigation.spec.ts` as fits the existing suite layout).
- [x] 2.2 Green: same-page branch in `Router.route()` — else of the `didRouteChange` gate per design D1/D4 (decode fragment, `getElementById`, `scrollIntoView`, empty-fragment → `scrollTo(0, 0)`).
- [x] 2.3 Red: deferred cases — cross-page navigation with a hash scrolls after routed content renders; initial load (router construction) with a hash scrolls after first routed render; unconsumed pending hash is overwritten by the next navigation.
- [x] 2.4 Green: pending-hash mechanism per design D3 — recorded on cross-page hash navigation and at construction; consumed once after the page-import activity delivers content, on the next animation frame (microtask fallback), guarded on `scrollIntoView` existing.
- [x] 2.5 Server safety: extend a server test (`packages/core/tests/server/route-rendering.test.mjs`) to render a route-table app under a URL with a `#fragment` and assert no throw (spec scenario "inert off-browser").

## 3. Verification & docs

- [x] 3.1 Full verification: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests`, `pnpm format:check`.
- [x] 3.2 `packages/core/README.md`: document hash/anchor behavior in the routing section (same-page, cross-page, initial load, single-attempt contract) and the zero-value attribute rule alongside the existing falsy-attr documentation.
- [x] 3.3 Changeset for `@loom-js/core` (patch or minor per repo convention) noting both behaviors, including the `value={0}` behavior change.
- [x] 3.4 Update `SOLID-AUDIT-REPORT.md` only if touched files carry open entries (check before edit per the Audit Rule); no skill-config.md impact expected (no structural/convention changes).
