# Docs Search

## Why

The docs site has no search: a reader who knows the name of a concept (`lazyImport`, "dehydrated state", "keyed lists") has to guess which of 16+ topics holds it and scan the side nav. Every comparable docs site opens a search palette on Cmd/Ctrl+K, and the build already holds every topic's title, headings and text in memory while it writes `llms.txt` — the index is a by-product waiting to be written.

## What Changes

- The site header gains a search trigger (icon + `⌘K` / `Ctrl K` hint) on every route; Cmd/Ctrl+K opens the same palette from anywhere on the site. Cmd/Ctrl+K is the convention (GitHub, Algolia DocSearch, Linear, Notion); Cmd/Ctrl+Shift+K is not adopted.
- The palette is a modal dialog: a search input, a ranked result list (topic › heading, snippet), arrow-key selection, Enter to navigate client-side to `/docs/<slug>#<heading>`, Escape to close.
- The production build emits a static search index (`/static/search/index.json`) in `prerender.after`, from the same Contentful data and in the same pass that writes the llms files — one entry per topic lead and per h2/h3 section, anchors identical to the rendered page's. Never authored, never committed; the build fails if a listed topic is missing from it.
- Search runs in the browser with no search dependency: a small ranker over the fetched index, loaded lazily on first open through core's `lazyImport`, so no route's initial bundle grows.
- `@loom-js/pink` gains `PinkModal`, the loom component for Pink Design's existing Modal (`scss/7-components/_modal.scss`: `dialog.modal` → `form.modal-form` → `modal-header` / `modal-title` / `modal-content` / `modal-footer`, sizes `is-small` / `is-big`), opened and closed through the native `<dialog>` API. The palette composes it. Maintainer approval recorded 2026-10-04: the Modal is an upstream pink component, not a new invention.
- `@loom-js/contentful` gains a plain-text serializer for rich-text nodes, the sibling of `documentToMarkdown`, so index bodies carry prose without markdown syntax.

## Capabilities

### New Capabilities

- `docs-search`: the header trigger and global shortcut, the palette's search/rank/navigate behavior, and the build-emitted index that feeds it.
- `pink-modal`: `PinkModal` — the Pink Design modal as a loom component with native `<dialog>` open/close, header with title and close button, content and footer regions, and the size variants.

### Modified Capabilities

_None._ `docs-component-sourcing`'s approval requirement is satisfied, not changed; `docs-llms-text` is untouched (the index is a separate build output with its own requirements).

## Impact

- `apps/loom` — header (`pages/layout.ts`) gains the trigger; a `useSearchShortcut` window listener; new `components/search/` (palette, result list), `logic/search/` (ranker, index provider + activity); `prerender.entry.ts` exports a per-topic section serializer; `loom.config.ts` `after` writes the index; `project/client/search-index.mts` assembles and asserts it (node tests beside `llms-text.test.mjs`).
- `packages/pink` — new `PinkModal` + story + minor changeset.
- `lib/contentful` — `documentToText` / `nodeToText` + node test (private workspace, no changeset).
- Build output — one new file under `build/static/search/`; default static caching, like the llms files.
- Docs — `docs/topics/16-app-structure.md` gets a line for the header's search if its anatomy lists header contents (push = publish).
- `.claude/skills/skill-config.md` — note the new `apps/loom/src/app/logic/search/` folder if the file inventories app folders.
