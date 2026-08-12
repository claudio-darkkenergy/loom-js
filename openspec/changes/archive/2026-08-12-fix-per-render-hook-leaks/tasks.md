## 1. Groundwork

- [x] 1.1 Verify `matchedRoute` / `params` semantics in `packages/core/src/router.ts` for docs vs non-docs routes (design D4 depends on this); if the docs-route guard can't be expressed cleanly, pause and update design.md
- [x] 1.2 Confirm audit state: `apps/loom/src/app/pages/docs/layout.ts` carries the open 🟡 SRP entry this change resolves; no 🔴 entries exist for the `lib/utils` files being touched

## 2. lib/utils hook fixes

- [x] 2.1 Memoize `useMediaQuery` per normalized query string (module-level map; same activity + single listener per query) per design D1
- [x] 2.2 Make `useToggle` idempotent per (toggle activity, query) pair via a `WeakMap` guard per design D2
- [x] 2.3 Fix `matchQuery.unsubscribeMql` to remove the listener reference it actually registered (design D5)
- [x] 2.4 `pnpm -F @loom-js/utils type-check`

## 3. apps/loom docs setup extraction

- [x] 3.1 Create `use-docs-layout.ts` in `apps/loom/src/app/logic/hooks/` encapsulating the four setup calls behind a run-once guard, with the redirect and topic watchers scoped to the docs route (design D3/D4)
- [x] 3.2 Slim `DocsLayout` to call `useDocsLayout()` and render only
- [x] 3.3 `pnpm -F @loom-js/loom type-check`

## 4. Verification (browser, per design D6)

- [x] 4.1 In the running app: enter/leave the docs section 3+ times, then navigate to a topic — exactly one topic-content request in the network log
- [x] 4.2 TOC and side-nav toggles work at desktop and mobile widths; manual toggle state survives leaving and re-entering docs; breakpoint crossings still resync
- [x] 4.3 `/docs` still redirects to the default topic; navigating outside docs never triggers the redirect

## 5. Bookkeeping

- [x] 5.1 Update `SOLID-AUDIT-REPORT.md`: mark the `layout.ts` SRP entry ✅ Resolved (use the `solid-audit` skill conventions; adjust the summary table)
- [x] 5.2 Run `pnpm format` and confirm `pnpm format:check` passes; confirm no changesets are needed (both packages private)
