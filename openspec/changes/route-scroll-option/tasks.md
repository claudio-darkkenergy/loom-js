# Tasks — route-scroll-option

## 1. Type surface

- [ ] 1.1 Add `scroll?: boolean` to `OnRouteOptions` in `packages/core/src/types.ts` with a doc comment (default `true`; suppresses every fragment scroll of the navigation, nothing else)

## 2. Router (TDD)

- [ ] 2.1 Red: same-page opt-out specs in `packages/core/tests/unit/hash-navigation.spec.ts` — `{ scroll: false }` updates the URL, emits nothing on location/route, and calls neither `scrollIntoView` nor `scrollTo` (target present, and bare `#`); an explicit `{ scroll: true }` and an omitted option both still scroll
- [ ] 2.2 Red: cross-page opt-out spec in `packages/core/tests/unit/hash-navigation-routed.spec.ts` — `{ scroll: false }` to a different route with a fragment renders the page with no deferred scroll, and a stale pending fragment from an earlier navigation is still dropped
- [ ] 2.3 Green: thread the option in `route()` — skip `scrollToFragment` for the same-page path and store no `pendingFragment` for the route-changing path when `scroll === false`; `scrollToFragment` and `consumePendingFragment` unchanged
- [ ] 2.4 Refactor pass; `pnpm -F @loom-js/core type-check`, `type-check-tests`, `test-ci` green

## 3. Docs & release

- [ ] 3.1 README routing section: add `scroll?: boolean` to `route`'s `options` list and a sentence in the hash/anchor navigation paragraph on when to opt out (caller-owned: the user is already at the target)
- [ ] 3.2 Add a **minor** changeset for `@loom-js/core`
- [ ] 3.3 `pnpm format` over touched files
