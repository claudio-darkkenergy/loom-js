# Design — docs-search

## Context

```
build (prerender.after)                          browser
────────────────────────                         ───────────────────────────────────
listDocsSections ──► docsTopicSearchEntries ──► static/search/index.json
                      (collectHeadingAnchors            │ fetch on first open
                       + documentToText)                ▼
                                          ⌘K / trigger ──► lazyImport(palette) ──► rank(query, index)
                                                                                     │ Enter
                                                                                     ▼
                                                                    route('/docs/<slug>#<anchor>') ──► close
```

- Header: `apps/loom/src/app/pages/layout.ts` renders `PinkGridHeader` with `col1` (brand) and `col2` (`PinkTopNav`); `col3`/`col4` are free. The css module collapses the grid to two areas when no col-3/col-4 class is present.
- Topics: Contentful rich text, one entry per `/docs/<slug>`; h2/h3 anchors come from `collectHeadingAnchors` (GitHub slugger + occurrence suffix). On `/` and `/benchmarks` no topic listing is in memory — the index must be static.
- Build: `prerender.after` already lists sections and serializes every topic (`docsTopicText`) for `llms.txt`; `assertLlmsTopics` fails the build on a bad set. No keyboard-shortcut, modal or search code exists anywhere in the repo. Pink carries `_modal.scss` (native `<dialog>`), `[type=search]` + `.icon-search`, `.kbd`, `.clickable-list`.
- Governance: `docs-component-sourcing` — compose from pink; a pink component port needs per-component approval. `PinkModal` approved 2026-10-04 as the port of pink's upstream Modal.

## Goals / Non-Goals

**Goals:**

- Cmd/Ctrl+K and a header button open one palette on every route; results land on the exact heading.
- Zero runtime search dependency; nothing added to any route's initial bundle; nothing added to prerendered state.
- The index is build output derived from the same data the pages render, asserted at build time.
- `PinkModal` is reusable by any pink consumer, not shaped around the palette.

**Non-Goals:**

- Full-text search over code blocks, fuzzy/typo tolerance, server-side or hosted search (Algolia etc.).
- Searching `/benchmarks` or marketing copy; pink topics join automatically when `docs-pink-section` lands (same listing).
- A `/` shortcut, recent-searches memory, analytics.
- Cmd/Ctrl+Shift+K — not the convention; one binding only.

## Decisions

### D1 — Shortcut is Cmd/Ctrl+K, handled at `window` with `preventDefault`

The de-facto docs standard (GitHub, DocSearch, Linear, Notion, Slack). `window` keydown listener registered in the layout's `onMounted`, removed in `onUnmounted` (the `use-fragment-sync` add/remove shape); `preventDefault` so Firefox's Ctrl+K address-bar focus and Chrome's search shortcut don't fire. The chord toggles from anywhere, editable fields included, matching the convention; the palette's input handles Escape and arrows itself.

_Alternative:_ `/` as a second binding. Rejected for now; it conflicts with typing in any future form and adds a second rule to explain.

### D2 — The index is written in `prerender.after`, beside the llms files

`after` already holds the sections and fetches every topic; one more serializer call per topic and one `writeFile` of `static/search/index.json`. The `copy` route is unavailable (nothing exists before esbuild runs) and seeding is unnecessary (the palette never renders at build time, so the index stays out of every route's dehydrated state).

Shape — one `SearchEntry` per topic lead and per h2/h3 section:

```
{ slug, title, group, heading, anchor, level: 0|2|3, text }
```

`anchor` is `''` for the lead and the rendered heading's id otherwise — produced by the same `collectHeadingAnchors` the page uses, so a result always lands on an element that exists. `text` is the section's prose: paragraphs, lists, quotes, table cells and inline code, through a new `documentToText`/`nodeToText` in `@loom-js/contentful`; fenced code blocks are skipped (noise, size; API names already appear in headings and prose). Every listed topic is indexed, including trailing utility topics (`feedback`) — the llms exclusion is about API content, not findability.

`project/client/search-index.mts` (node-tested like `llms-text.mts`) holds `assertSearchIndex(entries, topics)`: every listed slug has a lead entry, no empty headings, no duplicate `(slug, anchor)` — throws, failing the build.

_Alternative:_ derive sections from the markdown `docsTopicText` already returns. Rejected: heading ids computed from markdown (backticks in heading text) would drift from the rendered ids.

### D3 — Ranking is a small in-house pure function

Corpus is ~16 topics, ~150 entries; a linear scan per keystroke is sub-millisecond. `rank(query, entries, limit = 8)`: lowercase, split on non-word chars; every query token must match (prefix match on a word) in title, heading or text; score = title hits × 3 (× 1 on section entries — every section carries its topic's title, and a query naming the topic should land on the topic) + heading hits × 2 + text hits × 1, with a bonus when the whole query appears contiguously; stable tie-break on listing order so results follow the learning path. Snippet: the sentence containing the first text hit, trimmed to ~120 chars. Lives in `apps/loom/src/app/logic/search/rank.ts` — pure, no DOM, imported by the palette; its tests run under `node --test` with Node's native type stripping (`project/client/tests/rank.test.mjs` importing the `.ts`; Node 24 strips types by default), the same harness the app already uses.

_Alternative:_ MiniSearch / Fuse.js. Rejected: a dependency and a bundle for a problem this small; the framework's stance is zero runtime deps and the docs app dogfoods it.

### D4 — The palette is lazily imported on first open

The layout owns only the trigger button, the shortcut hook and an `isSearchOpen` activity. Opening calls `lazyImport('docs-search', () => import('./components/search/DocsSearch'))`, whose module pulls the ranker and the index provider; the index itself is fetched once (`resource('docs:search-index', getSearchIndex)`) when the module mounts. Nothing search-related is in any route's initial chunk; the prerender never opens the palette, so the import never runs at build time. Repeat opens are instant (cached activity + cached resource). A failed fetch renders an inline "Search is unavailable" state in the palette, never blocks the page.

Two constraints the implementation met: the importer resolves the component export, not the module namespace (an activity cannot commit a namespace object, and the failure is silent); and the palette's CSS module is imported by the host in the entry bundle too, since a stylesheet esbuild emits beside a lazy chunk is never linked. In `loom dev` the index file does not exist (no prerender), so the palette shows its unavailable state unless a built `static/search/index.json` is dropped into `build/`.

### D5 — `PinkModal` is the pink Modal, verbatim, over the native `<dialog>`

Markup per pink's documentation: `dialog.modal[.is-small|.is-big|.is-huge]` → `form.modal-form[method=dialog]` → `header.modal-header` (`h4.modal-title.heading-level-5` + `button.is-text.is-small.is-only-icon[aria-label="Close modal"] > .icon-x`) → `div.modal-content > div.modal-content-spacer` → `div.modal-footer`. A `headerStart` named slot renders before the title (pink's avatar spot; the `h4` only takes inline content, so the avatar can't ride `title`), and the title's id labels the dialog via `aria-labelledby`. Props: `title`, `description` (the header's `<p>`), `size`, `isSeparateHeader`, `isOpen` (drives `showModal()`/`close()` in `onRendered`), `onClose` (fires on the dialog's `close` event, so Escape and backdrop/close-button all funnel through one callback), `closeOnEscape` (default true, via the dialog's `cancel` event) and `closeOnOutsideClick` (default false; a click whose target is the dialog itself is on the backdrop), `footer`, `children` as content. On open, focus goes to an `autofocus` element, else the first control in the content, else the footer's first button. The component owns no search semantics. Exported from `packages/pink/src/index.ts` with a story and a minor changeset (pink stays pre-1.0).

The docs palette (`apps/loom/src/app/components/search/DocsSearch.ts`) composes `PinkModal` with a `[type=search]` input (pink `.input-text` + `.icon-search`, `.kbd` Esc hint), a `.clickable-list` of results, and an empty/no-results line. Active result follows ↑/↓ with `aria-activedescendant`; Enter or click calls `route(event, { href })`, then closes.

### D6 — The trigger renders a neutral hint at build time, the platform hint after mount

Prerendered markup can't know the reader's OS. The button renders `icon-search` + `aria-label="Search docs"` + a `.kbd` whose text is an activity initialised empty and set to `⌘K` or `Ctrl K` from `navigator.platform` in `onMounted`. The button sits in `PinkGridHeader`'s `col3` slot with `grid-header-col-3`; the hint is hidden on mobile (`is-not-mobile`), the icon stays.

## Risks / Trade-offs

- [Index staleness: `/static/search/index.json` is unhashed and cached by the CDN with default headers] → same policy as `llms.txt`; a deploy replaces it and Vercel's default `must-revalidate` revalidates per load. Revisit only if `app-edge-caching` tightens static headers.
- [Index size grows with the docs] → ~150 entries today, prose only, no code; the build logs the byte size like the llms files. No cap.
- [Ctrl+K is also Firefox's address-bar search] → `preventDefault` at `window` wins once the page has focus; a reader with focus in the chrome keeps the browser behavior, which is correct.
- [Hydration: the hint's text differs between build and client] → it is an activity rendered empty on both sides and updated post-mount, so markup matches at hydrate time.
- [`<dialog>` focus trap and Escape are native; `showModal` throws if the element is detached] → `isOpen` is applied in `onRendered`, where the node is live; `onClose` reads the native `close` event so state can't desync.
- [Search semantics drift from the page: a heading renumbered in Contentful changes its anchor] → the index and the page share one anchor function and one build; a stale index cannot outlive a deploy.
- [Node type-stripping for the ranker test] → the file stays free of enums/namespaces/parameter properties (stripping-safe TS); if it ever can't, move the ranker to a `.mts` under `project/client` and import it from the app.

## Migration Plan

Additive; no data or route changes. Ship pink's `PinkModal` and the app in one landing (the app depends on the workspace pink). Rollback is `git revert`; the index file disappears with the next build.

## Open Questions

None — the shortcut (Cmd/Ctrl+K) and the pink home for the modal were settled 2026-10-04.
