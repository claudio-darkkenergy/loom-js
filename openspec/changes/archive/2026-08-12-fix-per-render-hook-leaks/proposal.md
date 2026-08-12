## Why

Every invocation of `DocsLayout` (each entry into the docs section) re-registers persistent global listeners that can never be removed — loom has no reactive teardown (that's a separate follow-up). Four leaks stack per mount: two `matchMedia` listeners plus fresh activities (`useSideNavToggle` / `useTopicTocToggle` → `useToggle` → `useMediaQuery` creates a new activity and listener per call), one route watcher for the default-topic redirect, and one route watcher that fetches topic content. After N visits to the docs section, every topic navigation fires N Contentful fetches (racing `topic` updates) and every breakpoint crossing fires N toggle updates. This is the same leak class that compounded the archived `fix-docs-toc-duplication` bug.

## What Changes

- Memoize `useMediaQuery` (`lib/utils/src/loom-js/hooks/use-media-query.ts`) per normalized query string: one activity + one `matchMedia` listener per distinct query for the app lifetime.
- Make `useToggle` (`lib/utils/src/loom-js/hooks/use-toggle.ts`) idempotent per (toggle activity, query) pair so repeated calls don't stack watchers on the shared memoized activity.
- Fix `matchQuery`'s broken `unsubscribeMql` (`lib/utils/src/responsive/match-query.ts`): it registers an anonymous wrapper but tries to remove the named handler, so it can never unsubscribe.
- Extract a `useDocsLayout()` hook in `apps/loom` that performs the docs setup (toggle wiring, default-topic redirect, page fetch, topic route watcher) exactly once per app lifetime; `DocsLayout` becomes render-only. This also resolves the open 🟡 SRP audit violation for `apps/loom/src/app/pages/docs/layout.ts`.
- Behavior note: re-entering the docs section no longer force-resyncs toggle state from the media query on every mount — state persists, and the media query still drives updates on actual breakpoint changes.

Out of scope: reactive teardown/unsubscribe in core (follow-up), narrowing the docs effect boundary (blocked on teardown), and caching `useSelectedPage`/`useSelectedTopic` fetch results.

## Capabilities

### New Capabilities

- `hook-setup-idempotence`: media-query and toggle hooks are memoized/idempotent (at most one listener and one activity per distinct query; at most one watcher per toggle-query pair), the `matchQuery` unsubscribe actually removes its listener, and docs-section setup registers its global watchers exactly once regardless of how many times the section is mounted.

### Modified Capabilities

<!-- none — core specs untouched -->

## Impact

- `lib/utils/src/loom-js/hooks/use-media-query.ts`, `use-toggle.ts`, `lib/utils/src/responsive/match-query.ts` — hook-layer fixes benefiting all consumers.
- `apps/loom/src/app/logic/hooks/` (new `use-docs-layout.ts`; existing toggle/redirect/topic hooks re-scoped under it), `apps/loom/src/app/pages/docs/layout.ts` — setup extracted, render-only component.
- `SOLID-AUDIT-REPORT.md` — mark the `layout.ts` SRP entry resolved (Audit Rule).
- No `@loom-js/core` changes. Both touched packages (`@loom-js/utils`, `@loom-js/loom`) are private — no changesets.
