## Context

`DocsLayout` (`apps/loom/src/app/pages/docs/layout.ts:30-38`) runs four setup calls in its component body. Because loom has no unsubscribe mechanism, each call registers state that lives for the app's lifetime, and each re-mount of the docs section stacks another copy:

1. `useSideNavToggle(...)` and `useTopicTocToggle(...)` → `useToggle` → `useMediaQuery`, which creates a **new** `activity<MediaQueryList>` and a **new** `window.matchMedia` `change` listener on every call (`use-media-query.ts:5-10`), then `watch`es it (another `reactiveEffect`). N mounts → N listeners all driving the same shared toggle activity, plus an immediate `toggle(matches)` that clobbers any manual toggle state on every mount.
2. `useDefaultTopicRedirect(...)` → `watchRoute(...)` → `routeActivity.watch(action)` — a route watcher per mount, forever.
3. `watchRoute(({ value }) => useSelectedTopic(value.params.topic))` (`layout.ts:35-38`) — a route watcher per mount; each one refetches topic content and calls `topic.update(undefined)` then `update(data)`. After N mounts a single topic navigation triggers N racing Contentful fetches.

Separately, `matchQuery` (`lib/utils/src/responsive/match-query.ts`) registers an anonymous wrapper as the `change` listener but its returned `unsubscribeMql` calls `removeEventListener('change', onChange)` with the original named handler — it can never actually remove the listener.

`SOLID-AUDIT-REPORT.md` carries an open 🟡 SRP violation for `layout.ts` recommending exactly the extraction this change performs (`useDocsLayout()`); the Audit Rule says to resolve it when the file is next touched.

## Goals / Non-Goals

**Goals:**

- Repeated invocation of the media-query/toggle hooks and of the docs setup is idempotent: no listener, activity, or watcher accumulation across re-mounts.
- Fix at the hook layer (`lib/utils`) so every consumer benefits, not just `DocsLayout`.
- `matchQuery`'s unsubscribe actually works (needed by the future teardown work anyway).
- Resolve the `layout.ts` SRP audit entry by extracting `useDocsLayout()`.

**Non-Goals:**

- Reactive teardown/unsubscribe in `@loom-js/core` (`lib/reactive.ts`, `scopedActions`) — separate, design-heavy follow-up.
- Narrowing the docs effect boundary (blocked on teardown; see archived `fix-docs-toc-duplication` design D5).
- Caching/deduping Contentful responses in `useSelectedPage` / `useSelectedTopic` beyond removing the duplicate watchers.

## Decisions

**D1 — Memoize `useMediaQuery` per normalized query string.** A module-level `Map<string, activity>` keyed by the joined query; first call creates the activity + `matchQuery` listener, later calls return the cached activity. Alternative considered: once-guards at each call site — whack-a-mole, and leaves the hook itself a footgun for future consumers. The hook is the single place every leak flows through.

**D2 — Make `useToggle` idempotent per (activity, query) pair.** With D1, repeated `useToggle` calls would still stack `watch`ers on the now-shared media-query activity. Guard with a module-level `WeakMap<toggleActivity, Set<queryKey>>`: first call per pair registers the watcher, later calls are no-ops. `WeakMap` keeps this from pinning activities that go out of scope elsewhere.

**D3 — Extract `useDocsLayout()` with a run-once guard.** New hook in `apps/loom/src/app/logic/hooks/` encapsulating the four setup calls behind a module-level boolean; `DocsLayout` calls it and renders. First docs mount performs setup exactly as today; later mounts are no-ops. This is also the audit-recommended SRP fix. Alternative — moving setup to module top-level import time — rejected: it would run before any docs visit and changes initialization order observably.

**D4 — Scope the route-driven behaviors to the docs route inside `useDocsLayout`.** The redirect and topic watchers become global once registered (they already are today after the first docs visit — pre-existing). While extracting, guard their actions on the docs route (e.g. pathname/matched-route check) so a stray falsy `params.topic` outside the docs section can't trigger a redirect or a wasted fetch. Verify the exact `matchedRoute`/`params` semantics against `router.ts` during implementation; if reality differs from this assumption, pause and update this design.

**D5 — Fix `matchQuery` unsubscribe by naming the registered wrapper.** Keep a reference to the actual listener function that was added and remove that same reference in `unsubscribeMql`. No API change.

**D6 — Verification is browser-based, not unit-tested.** Tests live only in `packages/core` (repo convention); `lib/utils` has no runner, and adding one is out of scope. The observable claims are verified in the running app: repeated docs entries/exits followed by a topic navigation must produce exactly one topic fetch (network tab), and breakpoint crossings must produce single toggle transitions. Unit coverage for these hooks should arrive with the teardown follow-up, which will need `lib/utils` test infra regardless.

## Risks / Trade-offs

- [Behavior change: toggle state no longer resyncs from the media query on every docs re-entry] → Intended — a user's manual TOC/side-nav choice now survives leaving and re-entering docs; the media query still fires on real breakpoint changes. Verify UX at desktop and mobile widths before closing.
- [D4 route-scoping could break the `/docs` → default-topic redirect] → Explicit verification step: `/docs` must still land on `get-started`, and navigating home must never redirect back into docs.
- [Memoized media-query activities live forever] → They're bounded by the number of distinct query strings (two in this app) — strictly better than unbounded per-mount growth.
- [No unit tests for the changed hooks] → Accepted per D6; behavior pinned by the spec scenarios and browser verification.
