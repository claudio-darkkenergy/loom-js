# Design — align-loom-docs-with-core-readme

## Context

`packages/core/README.md` (~1000 lines, scrubbed for accuracy by `scrub-core-readme` and kept honest by the `core-readme-accuracy` spec) documents the full consumer API in one page: Install/Inclusion, then Concepts (bootstrapping, framework configuration, components / simple components / element syntax / element components, custom elements, activities, routing, lazy imports, SSR & SSG, client hydration, dehydrated state, diagnostics), then long-form Examples.

The docs app renders `/docs/:topic` from Contentful: `usePageContent` fetches a page listing (side nav) + the selected topic body in one GraphQL request, fanning out to the `page`/`topic` activities; `DocsSideNav` renders the listing; `TopicContent`/`StyledRichText` render the body, already mapping `MARKS.CODE` → `PinkCodePanel` and anchoring h2s by kebab-cased text. The topics that exist in Contentful today predate the README scrub.

Constraints:

- Contentful stays the runtime content source (decided at proposal time). No in-repo markdown pipeline.
- New UI composes from `@loom-js/pink`; a component missing from pink may be ported from upstream [appwrite/pink](https://github.com/appwrite/pink) **only with the maintainer's explicit approval, per component, before code is written**.
- The in-flight `core-api-follow-ups` change edits three README sections (`placement`, route `guard`, lazy-import example). Content authored here must match the README **after** that change lands.
- Loom is a general product: docs describe the API for all consumer types; nothing app-specific leaks into how concepts are framed.

## Goals / Non-Goals

**Goals:**

- One docs topic per core README concept, each at its own `/docs/:topic` URL, ordered as a learning path in the side nav.
- A checked-in content map that makes README ↔ docs parity reviewable and future drift detectable.
- Docs UI capable of rendering everything the README content needs (code blocks, callouts, tables, topic-to-topic links, prev/next navigation) using pink.
- A standing sourcing rule for docs components (pink first, upstream port only with approval).

**Non-Goals:**

- No `@loom-js/core` changes; no README changes (the README stays canonical; docs follow it).
- No automated README→Contentful sync tooling (the content map is the manual bridge; automation is future work).
- No redesign of the home page, Contentful proxy, caching, or toggle behavior (covered by existing specs).
- No docs versioning story.

## Decisions

### D1 — Topic granularity: 12 topics, sub-sections stay in-page

One topic per top-level concept, splitting only where the README itself carries enough weight (Components' element-syntax material is its own topic; custom elements is its own topic):

| #   | Slug               | README source sections                                           |
| --- | ------------------ | ---------------------------------------------------------------- |
| 1   | `getting-started`  | Feature Highlights, Install, Inclusion                           |
| 2   | `bootstrapping`    | Bootstrapping your application (+ App Initialization example)    |
| 3   | `configuration`    | Framework configuration                                          |
| 4   | `components`       | Components, Simple components (+ Components examples)            |
| 5   | `element-syntax`   | Composing components (element syntax), Element components        |
| 6   | `custom-elements`  | Custom elements (props, light vs. shadow DOM, known limitations) |
| 7   | `activities`       | Activities (transforms, options, returns)                        |
| 8   | `routing`          | Routing                                                          |
| 9   | `lazy-imports`     | Lazy imports                                                     |
| 10  | `server-rendering` | Server rendering (SSR & SSG)                                     |
| 11  | `hydration`        | Client hydration                                                 |
| 12  | `dehydrated-state` | Dehydrated state                                                 |
| 13  | `diagnostics`      | Diagnostics (warnings & debug logging)                           |

The README's trailing Examples section is not a topic — each example is folded into its concept's topic (the multi-page win: examples live next to the concept they illustrate). Sub-sections within a topic map to h2/h3 rich-text headings, which the existing `TopicToc` + heading-anchor rendering already turn into an on-page TOC.

_Alternative considered:_ one giant "concepts" topic mirroring the README — rejected; that re-creates the single-page limitation the change exists to remove.

### D2 — Content map is a checked-in artifact of this change

`openspec/changes/align-loom-docs-with-core-readme/content-map.md` records, per topic: slug, title, side-nav order, source README line-range/headings, per-topic outline (h2/h3 structure), code samples to carry over, and cross-topic links. Contentful entry work follows the map; the map — not the Contentful space — is what review and future drift-checks read. The maintainer reviews the map before any Contentful entry happens.

_Alternative considered:_ scripting entries via the Contentful Management API — rejected for now; there's no management-API infrastructure in the repo, and 13 topics is hand-enterable. The map keeps the door open for automation later.

### D3 — Contentful model reuse; model changes only if forced

The existing page → topics model (listing + rich-text `description`) already supports the IA: the docs page's topic collection becomes the 13 topics in learning-path order. Rich text covers headings, code marks, lists, tables, and hyperlinks. Only if an outline demands something the model can't express (e.g. a distinguishable "callout" block) do we touch the model — preferred escape hatch first: a rich-text convention (e.g. blockquote → callout rendering) over a new content type.

### D4 — Rendering upgrades ride the existing StyledRichText options

Everything content-specific lands as `renderNode`/`renderMark` options in `StyledRichText` (or a docs-scoped wrapper), not new pipelines:

- **Code blocks**: `MARKS.CODE` already renders `PinkCodePanel`; extend for multi-line samples (line numbers on, language label via panel header) as the content map requires.
- **Callouts**: `BLOCKS.QUOTE` → callout rendering (pink card/tag composition, or an upstream `alert` port if approved).
- **Tables**: rich-text table blocks → styled table (pink composition first; upstream `table` port if approved).
- **Cross-topic links**: rich-text hyperlinks to `/docs/<slug>` render through the SPA's `onRoute` handling so topic-to-topic navigation stays client-side.

### D5 — Prev/next topic navigation is derived, not authored

A `TopicPagination` app component reads the already-fetched page listing (`page` activity) and the current topic slug to render previous/next links — no new data, no Contentful field. Composed from pink buttons/cards.

### D6 — Component sourcing gate (the approval protocol)

The apply phase starts with a **component inventory checkpoint**: after the content map is reviewed, list every UI need, resolve each to (a) an existing `@loom-js/pink` export, (b) a composition of existing pink components, or (c) a gap requiring an upstream appwrite/pink port. Category (c) items are presented to the maintainer **individually** for approval before implementation; unapproved gaps get a (b)-style fallback or the content is reworded to not need them. Anticipated (c) candidates: `alert` (callouts), `table`. Each approved port lands in `packages/pink` with a minor changeset (pink stays pre-1.0).

### D7 — Sequencing against core-api-follow-ups

Content for `bootstrapping` (placement), `routing` (guard), and `lazy-imports` (typing example) is authored last, after `core-api-follow-ups` merges its README edits. Everything else can proceed in parallel. If that change stalls, these three topics are authored from the README as-is and flagged in the content map for a follow-up pass.

### D8 — Server-first readiness (constrain here, build there)

The rendering pipeline itself — SSG prerender at build time, `hydrate` + `primeResources` boot, edge caching, ISR seam — is the sibling change `server-first-loom-app`. This change adopts its readiness constraints so nothing built here blocks it:

- **SSR-safe components.** Core injects a per-render window (linkedom) through an internal provider seam (`lib/dom.ts`) — it never patches `globalThis`, so bare `window`/`document` references in app code throw in Node even mid-render, and module scope runs before any window is injectable at all. Rule: framework-mediated rendering (templates, `el`, routing) needs nothing special; app-level browser APIs (`matchMedia`, `localStorage`, observers, measurement) live only in `onMounted` and event handlers, which never fire server-side.
- **Data through `resource()`.** Docs/home content loads wrap in core's keyed resource cache inside activity transforms, so the settlement signal tracks them and `dehydrate()` can capture them. Done here because this change already touches the data layer; the sibling change then finds the data capturable.
- **Slugs are permanent static paths.** Prerendering turns `/docs/<slug>` into physical `index.html` files; a slug rename after that is a broken URL unless paired with a redirect. The content map treats slugs as immutable identifiers from day one.

_Alternative considered:_ folding the pipeline into this change — rejected as two changes in a trenchcoat; the pipeline touches bootstrap, build scripts, `vercel.json`, and deploy hooks, none of which is docs-content work.

### D9 — Copy affordances are a behavior, composed (added 2026-08-29)

Copy-to-clipboard is one behavior with many hosts (code panel, heading link, inline code), so pink ships it as `PinkCopyToClipboard`: a polymorphic host around static `children` or a state-aware `render(copied)` where `copied` is the activity's read surface (`bind`/`effect`/`value`/`watch`) — a child binds an attribute and keeps its node, or effects a text node in place. `PinkCopyButton` composes it over `PinkButton` (icon bound to the copied state; `href` makes it an anchor with native link semantics intact), and `PinkCodePanel.CopyButton` sizes it into the header. Binding the icon required `withIcon`/`PinkButton` to pass an `AttrBinding` through and core to export `isAttrBinding` (a `Symbol`-keyed guard pink can't duck-type). A render-function `children` was rejected only because core's `ReservedProps.children` type already contains function types; `render` is the honest pink-side shape until core widens it.

### D10 — Heading link anchors route through loom (added 2026-08-29)

Each h2 gets a `<a href="#id">` copy-link (status bar, right-click, modified clicks all native) whose click goes through `route()`: a native hash jump fires `popstate`, the location layer re-renders the docs content, and the copied feedback dies mid-swap. The retired `get-started` pathname is not redirected (maintainer decision; map updated). The remaining scroll-on-click is `route-scroll-option`'s job.

### D11 — Docs code style: 2-space samples, comment conventions (added 2026-08-29)

The README stays at prettier's 4 spaces (repo convention); `contentful-sync/md2rich.py` re-indents fenced code 4→2 at push time (whole levels scale, remainder such as the ` *` comment-alignment space is kept) because the ~680px panel clips 4-space samples. Block comments use `*` lines; result annotations sit on their line's end (`…; // => true`) or above it, never below.

## Risks / Trade-offs

- [README and Contentful drift after this change] → `docs-content-coverage` spec makes parity a standing requirement; the content map documents the mapping so a future drift-check (manual or scripted) has something to diff against. README edits should prompt a docs-topic touch, mirroring how `core-readme-accuracy` keeps the README honest against code.
- [Contentful entry is manual and outside git] → the reviewed content map is the source of truth for what was entered; verification tasks load each topic route and check it against the map before the change is archived.
- [Approval gate stalls the UI work] → the inventory front-loads all approval asks into one checkpoint; every gap has a named composition fallback so a "no" never blocks content.
- [Rich-text conventions (quote→callout) are invisible in Contentful's editor] → conventions are documented in the content map so future authors know them; if they prove too fragile, a model-level content type is the recorded next step.
- [core-api-follow-ups timing] → D7's flag-and-follow-up path keeps this change archivable even if the core change lands late.

## Open Questions

- None blocking. The (c)-category port list (alert, table) is intentionally provisional until the content map is written — the inventory checkpoint (D6) is where it gets settled with the maintainer.
