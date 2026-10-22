## 1. PinkModal (pink)

- [x] 1.1 Add `packages/pink/src/components/pink-modal/pink-modal.ts` — `dialog.modal` markup per pink's docs, `title` / `size` / `isOpen` / `onClose` / `footer` props, `showModal()`/`close()` applied in `onRendered`, `onClose` wired to the native `close` event
- [x] 1.2 Add `index.ts` and `pink-modal.stories.ts` following pink's docs (Default, Sizes, Separate Header, Best Practice, plus Close Behaviors and Without Footer; every prop a control), export from `src/index.ts`
- [x] 1.3 `pnpm -F @loom-js/pink type-check` and open the story in Storybook to confirm backdrop, sizes and close paths
- [x] 1.4 Add a minor changeset for `@loom-js/pink`

## 2. Plain-text serializer (contentful)

- [x] 2.1 Add `lib/contentful/src/rich-text-text.ts` — `nodeToText` / `documentToText`: paragraphs, lists, quotes, table cells, inline code as text; fenced/sole-code blocks skipped; unknown node types throw like `documentToMarkdown`
- [x] 2.2 Export from `lib/contentful/src/index.ts`; add `lib/contentful/tests/rich-text-text.test.mjs`; `pnpm -F @loom-js/contentful test-ci`

## 3. Search index at build time (loom app)

- [x] 3.1 Add `apps/loom/project/client/search-index.mts` — `SearchEntry` type, `assertSearchIndex(entries, topics)` (lead per listed slug, non-empty headings, unique `(slug, anchor)`), `searchIndexJson(entries)`
- [x] 3.2 Add `project/client/tests/search-index.test.mjs` covering the assertions and the serialized shape; `pnpm -F @loom-js/loom test-ci`
- [x] 3.3 Export `docsTopicSearchEntries(slug, group)` from `src/app/prerender.entry.ts` — splits the rich text at h2/h3 using `collectHeadingAnchors` (same ids as the page), lead entry with `anchor: ''`, section text via `documentToText`; add it to `LoomPrerenderBundle` in `loom.config.ts`
- [x] 3.4 In `loom.config.ts` `prerender.after`, build entries for every listed topic (no slug exclusion), `assertSearchIndex`, write `static/search/index.json` under `outDir` and log its byte size beside the llms files
- [x] 3.5 Run an isolated prod build (`LOOM_BUILD_DIR`) and check: the file exists, every topic has a lead entry, a sampled anchor exists as a heading id in that topic's prerendered HTML, and no state script contains `docs:search-index`

## 4. Runtime search (loom app)

- [x] 4.1 Add `src/app/logic/search/rank.ts` — pure `rank(query, entries, limit = 8)` with the title 3 / heading 2 / text 1 weights, all-tokens prefix matching, contiguous bonus, listing-order ties, and `snippet(entry, query)`; stripping-safe TS only
- [x] 4.2 Add `project/client/tests/rank.test.mjs` importing the `.ts` under Node's type stripping: heading beats body, all tokens required, empty query, tie order, snippet window; `pnpm -F @loom-js/loom test-ci`
- [x] 4.3 Add `src/app/logic/providers/search-index.ts` (`SEARCH_INDEX_URL`, `getSearchIndex` fetch + shape check) and `src/app/logic/activity/search-index.ts` (`resource('docs:search-index', …)`, failure value like `bench-results`)
- [x] 4.4 Add `docsSearchToggle` to `logic/activity/toggles.ts` and `logic/activity/docs-search.ts` (query + selection state); add `src/app/logic/hooks/use-search-shortcut.ts` — window keydown for Cmd/Ctrl+K (no Shift), `preventDefault`, add in `onMounted` / remove in `onUnmounted`
- [x] 4.5 Add `src/app/components/search/DocsSearch.ts` — composes `PinkModal` (big), `[type=search]` input with `.icon-search` and `.kbd` Esc hint, `.clickable-list` results as `title › heading` + snippet, ↑/↓ with `aria-activedescendant`, Enter/click → close then `route(null, { href })`, empty / no-results / unavailable states
- [x] 4.6 Add `src/app/components/search/SearchTrigger.ts` — `PinkButton` `icon-search` + `aria-label="Search docs"` + `.kbd` hint activity set from `navigator.platform` in `onMounted`, hint `is-not-mobile`; `DocsSearchHost.ts` lazy-imports the `DocsSearch` export via `lazyImport('docs-search', …)` on first open and keeps the dialog mounted after
- [x] 4.7 Mount in `pages/layout.ts`: `SearchTrigger` in `PinkGridHeader`'s `col3` slot with `grid-header-col-3`, `DocsSearchHost` beside `main`, `useSearchShortcut` on the layout; adjust `styles.module.css` grid areas for the third column
- [x] 4.8 `pnpm -F @loom-js/loom type-check`; dev smoke on `/`, `/benchmarks`, `/docs/<slug>`: trigger, ⌘K/Ctrl K toggle, Shift variant inert, Escape, ↑/↓/Enter lands on the heading, second open makes no request, index chunk absent from route shells

## 5. Docs, config, hygiene

- [x] 5.1 Check `SOLID-AUDIT-REPORT.md` for open violations in `pages/layout.ts`, `prerender.entry.ts`, `loom.config.ts` before editing; update entries if any are resolved
- [x] 5.2 Update `docs/topics/16-app-structure.md` if its header/anatomy section lists header contents or the `logic/` folders (new `logic/search/`); push and publish the topic through `docs/contentful-sync/`
- [x] 5.3 Update `.claude/skills/skill-config.md` if it inventories `apps/loom` folders or the node-test harness (new `.ts`-under-stripping test)
- [x] 5.4 `pnpm format:check`, `pnpm -F @loom-js/pink -F @loom-js/contentful -F @loom-js/loom type-check`, all three `test-ci`s; pause for IDE diff review before commit
