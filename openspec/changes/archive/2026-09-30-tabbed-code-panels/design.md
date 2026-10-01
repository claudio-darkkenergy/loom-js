# Design — tabbed-code-panels

## Context

`CodeSample` renders one sole-code paragraph per panel (`asCodeBlock` strips the `// @lang` directive into the header label); the copy button takes the block's full text. Pink ships `PinkTabs` (anchor-based `tabs-button` items for page-level nav) and the upstream `.tabs` classes. Rich-text gives us no block metadata beyond the code text itself, so variants must be expressed in the directive convention, and grouping must happen in the renderer over _consecutive_ blocks.

## Goals / Non-Goals

**Goals:** one panel per variant set; copy copies the active tab; a group choice (package manager) applies to every synced panel; server renders the default tab; zero change for untabbed panels.

**Non-Goals:** persisting the choice across sessions (localStorage) — v1 is per-page-lifetime via the activity; revisit if readers ask. Arbitrary tabbed content (this is code panels only). URL-addressable tabs.

## Decisions

### D1 — `PinkCodePanel.Tabs`, not `PinkTabs`

`PinkTabs` items are anchors with hrefs and scroll affordances — page navigation semantics. The panel wants plain `<button role="tab">` items on the same `.tabs`/`.tabs-button` classes, sized into the header like the copy button. A dedicated `PinkCodePanel.Tabs` (labels + a selection activity in, buttons out) stays honest about semantics; if a third tabs consumer appears, extracting a shared button-tabs base is mechanical.

### D2 — Selection is an activity; group sync is a keyed registry

The tab strip takes `selection: ReturnType<typeof activity<string>>`. The app owns a tiny module — `codeTabGroup(group): Activity<string>` (memoized per group key, à la `lazyImport`'s cache) — so every panel in group `pm` shares one activity: `bind` flips the active tab classes, an `effect` swaps the visible code and the copy `text` getter reads the active variant at click time. Ungrouped tabbed panels get a per-panel activity. Loom-idiomatic (pub/sub, no store) and prerender-safe: the activity's initial value is the first tab, so the server renders the default variant and hydration agrees.

### D3 — Directive grammar: `// @tab <label> [<group>]`, consecutive blocks merge

Line 2 of a sole-code paragraph (after `// @lang`): `// @tab npm pm`. The renderer walks the rich-text document's top level; a run of consecutive code blocks each carrying `@tab` becomes one `CodeSample` with tabs (first tab = default; the run's `@lang` labels may differ per tab — label shows the active tab's language). A `@tab` block whose neighbors have none renders as a normal panel (single tab is pointless; convention documented). Conventions live in the map, as ever.

### D4 — Converter surface: fence info strings

Topic sources stay plain markdown: ` ```bash tab=npm group=pm ` → the converter emits both directive lines. No new authoring tooling.

## Risks / Trade-offs

- [Directive lines are invisible convention in Contentful's editor] → same standing risk as `@lang`, same mitigation: the map documents it; the renderer degrades to a plain panel when directives are absent or unpaired.
- [Group sync re-renders every synced panel on switch] → each panel's swap is one effect re-render of its code lines; panels per page are few (≤10) and switches are user-initiated. Measure only if it ever stutters (framework-idiom-first).
- [Server renders npm but the reader wanted pnpm] → inherent to static defaults; the swap happens client-side post-hydration with no layout shift (tabs render identically).

## Migration Plan

Additive pink minor + app change; existing content untouched until sources adopt the fence meta. Install block converts in this change as the proving consumer.

## Open Questions

None.
