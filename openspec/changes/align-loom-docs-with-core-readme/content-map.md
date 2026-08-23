# Content map — align-loom-docs-with-core-readme

The canonical README → docs mapping (D2). Contentful entry work follows this map; review and
future drift-checks read this file, not the Contentful space. Source of truth for content:
`packages/core/README.md` as of commit `76aa6df` (post `core-api-follow-ups`).

**Slugs are immutable identifiers** (per `docs-prerender-readiness`): prerendering turns each
`/docs/<slug>` into a physical static path. A rename requires a redirect recorded here.

**Redirects:** the pre-scrub published slug `get-started` is superseded by `getting-started` —
`/docs/get-started` → `/docs/getting-started` must keep resolving (SPA redirect now; a physical
redirect once prerendering lands). The default-topic redirect target in `use-docs-layout.ts`
(`/docs/get-started`) updates to `/docs/getting-started` alongside the phase-4 entry work.

## D7 status — resolved

`core-api-follow-ups` has landed and is archived (`542dd65` shipped the `placement` union, working
route `guard`, and typed `lazyImport`; the README edits merged with it). The `bootstrapping`,
`routing`, and `lazy-imports` topics below are authored from the **current** README with no
deferral and no parity follow-up flag.

## Rich-text conventions

These conventions are how README constructs are entered in Contentful and how the renderer
interprets them. They are invisible in Contentful's editor, so authors must know them from here.

1. **Headings.** The topic title is the entry's title field — the body never uses h1. Body
   headings start at h2 (README h4/h5 sub-sections flatten to h3 where noted per topic).
   h2 text is kebab-cased into the anchor `id` (existing `StyledRichText` behavior) and feeds the
   on-page TOC — so **h2 text must be unique within a topic**, and renaming an h2 changes its
   anchor (treat h2 text as semi-permanent).
2. **Block code samples.** A paragraph whose *entire* content carries `MARKS.CODE` is a code
   block → `PinkCodePanel` with line numbers when multi-line. **Language label:** the block's
   first line is a directive comment, `// @lang ts` (or `bash`, `html`), stripped by the renderer
   and shown as the panel's header label; no directive → no label. *(Ratified at map review.)*
   **Single-line rule** (added during 3.1): a single-line sole-code paragraph renders as a code
   block **only with the directive** — without it, it renders inline. This keeps code-marked
   table cells and one-word paragraphs from becoming panels; single-line commands (e.g. the
   install lines) must carry `// @lang bash`.
3. **Inline code.** `MARKS.CODE` on a span *inside* a mixed-content paragraph renders as inline
   `<code>`, **not** a code panel. *(Renderer change — current behavior panels everything; part
   of task 3.1.)*
4. **Callouts.** `BLOCKS.QUOTE` → callout rendering (task 3.2). Used for the README's advisory
   asides (e.g. "Why light DOM is the default").
5. **Tables.** Rich-text table blocks → the approved table treatment (task 3.3). Used for the
   README's reference tables (life-cycle hooks, prop forms, `defineElement` arguments).
6. **Cross-topic links.** Rich-text hyperlinks with `/docs/<slug>` URIs navigate client-side
   (task 3.4). Links may target anchors: `/docs/activities#transforms-the-async-data-path`.
   README-internal anchor links are rewritten to their mapped topic/anchor.
7. **API signature blocks.** The README's `**API**` / `**Inclusion**` / `**Arguments**` /
   `**Returns**` label pattern is entered as bold-led paragraphs (no special block type) with
   inline code for identifiers — no content-model change needed.

## Topics

Side-nav order is the table order (the learning path). "Source" cites README headings; line
numbers refer to the pinned commit above.

| # | Slug | Title |
|---|------|-------|
| 1 | `getting-started` | Getting Started |
| 2 | `bootstrapping` | Bootstrapping |
| 3 | `configuration` | Configuration |
| 4 | `components` | Components |
| 5 | `element-syntax` | Element Syntax |
| 6 | `custom-elements` | Custom Elements |
| 7 | `activities` | Activities |
| 8 | `routing` | Routing |
| 9 | `lazy-imports` | Lazy Imports |
| 10 | `server-rendering` | Server Rendering |
| 11 | `hydration` | Client Hydration |
| 12 | `dehydrated-state` | Dehydrated State |
| 13 | `diagnostics` | Diagnostics |

The README's trailing **Examples** section is not a topic — each example folds into its concept's
topic (noted per topic below).

---

### 1. `getting-started` — Getting Started

- **Source:** intro blurb, Feature Highlights, Install, Inclusion (README 1–37).
- **Outline:**
    - h2 What is loom — the one-line pitch + feature highlights (rendered as a list, not a table).
    - h2 Install — npm/yarn commands.
    - h2 Inclusion — the import line.
    - h2 Where next — short guided pointer into the learning path.
- **Code samples:** `npm i @loom-js/core` / `yarn add @loom-js/core` (bash), `import * as Loom`
  (ts).
- **Cross-links:** feature-highlight bullets link to their topics (custom-elements, routing,
  lazy-imports, server-rendering, hydration, dehydrated-state); "Where next" → `bootstrapping`.

### 2. `bootstrapping` — Bootstrapping

- **Source:** Bootstrapping your application (README 41–78) + the `init` half of the App
  Initialization example (README 799–817).
- **Outline:**
    - h2 The app and `init` — what bootstrapping is.
    - h2 `AppInitProps` — `app`, `placement` (the `'replace' | 'append' | 'prepend'` union),
      `globalConfig`, `onAppMounted`, `root` (incl. the head/body → `#loom-app` fallback).
    - h2 Example — the fuller App Initialization example.
- **Code samples:** quick example (README 65–78), App Initialization `init` example (801–817).
  The example's SSG prerender variant (819–834) moves to `server-rendering`, cross-linked here.
- **Cross-links:** `configuration` (globalConfig), `hydration` (the pre-rendered boot
  alternative), `server-rendering` (prerendering the same app).

### 3. `configuration` — Configuration

- **Source:** Framework configuration (README 80–100).
- **Outline:**
    - h2 `AppGlobalConfig` — `debug`/`debugScope`, `events`, `token`.
    - h2 `appendEvents` — when the `$event` default set needs extending.
- **Code samples:** `appendEvents(['my-custom-event'])` (README 94–98).
- **Cross-links:** `diagnostics` (debug switches), `bootstrapping` (`init`), `hydration`
  (`hydrate` also takes `globalConfig`).

### 4. `components` — Components

- **Source:** Components (README 102–162), Simple components (164–187) + Examples › Components:
  simple example, props & interpolation, node access, life cycles (836–941).
- **Outline:**
    - h2 Defining a component — tagged template, single top-level element, fragment exception.
    - h2 The template function — `html` and `props`, `node()` getter.
    - h2 Life-cycle hooks — the five-hook table; server caveat for `onMounted`/`onUnmounted`.
    - h2 Attribute and text values — truthy/falsy application, the `0` exception.
    - h2 Simple components — `simple()` pass-through, when to reach for it.
    - h2 Examples — h3 Props and interpolation; h3 Accessing the rendered node; h3 Life cycles.
- **Code samples:** Button quick example (148–160), `simple` Button (178–187), simple example
  (840–848), props & interpolation (855–883), node access (887–905), life cycles (909–941).
- **Tables:** life-cycle hooks (134–140).
- **Cross-links:** `element-syntax` (composing), `custom-elements` (`defineElement` contrast),
  `activities` (effects inside templates), `server-rendering` (hook timing off-browser).

### 5. `element-syntax` — Element Syntax

- **Source:** Composing components (element syntax) (README 189–263), Element components
  (265–282).
- **Outline:**
    - h2 Composing in markup — sugar-over-functional-form framing; primary authoring surface,
      functional form as the value-position escape hatch.
    - h2 Props — the four forms (table); h3 Spread props; h3 No `$` sigil on component tags.
    - h2 Children — `</>` closing form.
    - h2 Named slots — labels, per-region contexts, static-label rules, native `<slot>`
      non-competition.
    - h2 Keys — `key` as ordinary prop, keyed reconciliation.
    - h2 Errors — first-render throws for malformed syntax.
    - h2 Element components — h3 `RouteLink`; h3 `Svg`; h3 `Picture`; h3 `el(tagName)`.
- **Code samples:** PinkButton composition (193–201), Panel children (222–229), Card named slots
  (235–253), RouteLink (271–275).
- **Tables:** prop forms (209–215).
- **Cross-links:** `components` (functional form), `routing` (`RouteLink` behavior),
  `custom-elements` (`$`-prefix keeps its element-only meaning).

### 6. `custom-elements` — Custom Elements

- **Source:** Custom elements (README 284–369).
- **Outline:**
    - h2 `defineElement` — contrast with `component()`; arguments table; returns.
    - h2 Passing props from a consuming page — `$`-prefixed attributes, interpolated JS
      properties, `children`.
    - h2 Light DOM vs. shadow DOM — default rationale (callout: "Why light DOM is the default"),
      custom properties + `options.styles`, `mode: 'open'` guidance.
    - h2 Known limitations — registration timing, attributes read once.
- **Code samples:** Card/PinkButton contrast (299–315), consuming-page HTML (323–325),
  interpolated `$` props (330–332), shadow + adopted styles (347–360).
- **Tables:** `defineElement` arguments (289–294).
- **Callouts:** "Why light DOM is the default" (364).
- **Cross-links:** `components`, `element-syntax`, `server-rendering` (elements applied to
  injected windows).

### 7. `activities` — Activities

- **Source:** Activities (README 371–482) + Examples › activity example (943–981), attribute
  binding example (449–465).
- **Outline:**
    - h2 The activity — pub/sub model, `V`/`I` type parameters.
    - h2 Transforms — the async-data path; settlement-signal tracking (anchor target for other
      topics).
    - h2 Options — `deep`, `force`, `transform`.
    - h2 The returned interface — `initialValue`; h3 `effect`; h3 `bind`; h3 `reset`;
      h3 `update`; h3 `value`; h3 `watch`.
    - h2 Examples — h3 Attribute binding; h3 Counter (quick example + effect example).
- **Code samples:** transform example (399–411), attribute binding (451–465), quick example
  (469–480), activity effect example (945–981).
- **Cross-links:** `components` (effects in templates), `server-rendering` / `hydration` /
  `dehydrated-state` (settlement + resource), `lazy-imports` (built on activities).

### 8. `routing` — Routing

- **Source:** Routing (README 484–608) + Examples › routing example (983–1027).
- **Outline:**
    - h2 The two-layer pipeline — location layer, route layer; one router per window.
    - h2 API — h3 `createRoutes` (`config`, `fallback`, `guard`); h3 `route`; h3 `routeEffect` /
      `watchRoute`; h3 `locationEffect` / `watchLocation`; h3 `redirect`; h3 `RouteLink`.
    - h2 Route guard — URL-moves-anyway semantics, auth redirect pattern, caller-owned loop
      avoidance.
    - h2 Hash and anchor navigation — same-page / cross-page / initial-load, single-attempt
      deferred scroll.
    - h2 Layer 1 on its own — route-less `locationEffect` usage.
    - h2 Example — the fuller routing example with `SyntheticRouteEventListener`.
- **Code samples:** createRoutes quick example (518–540), guard example (546–566), layer-1
  example (580–608), routing example (985–1027).
- **Cross-links:** `element-syntax` (`RouteLink`), `lazy-imports` (route pages load through it),
  `server-rendering` (per-window router isolation).

### 9. `lazy-imports` — Lazy Imports

- **Source:** Lazy imports (README 610–641).
- **Outline:**
    - h2 `lazyImport` — activity-wrapped dynamic import, per-key cache, settlement tracking.
    - h2 `importLazy` — the renderable-content convenience.
- **Code samples:** Dashboard/chart example (625–639).
- **Cross-links:** `activities` (settlement, `effect`), `routing` (`createRoutes` uses the same
  machinery), `server-rendering` / `hydration` (both wait on tracked imports).

### 10. `server-rendering` — Server Rendering

- **Source:** Server rendering (SSR & SSG) (README 643–683) + the SSG half of the App
  Initialization example (819–834).
- **Outline:**
    - h2 Rendering off-browser — same code path, injected window (linkedom), never patches
      globals.
    - h2 `renderToString` — options (`window`, `url`, `maxWait`), settlement gating.
    - h2 `renderToStringSync` — the synchronous primitive and when it's right.
    - h2 Semantics worth knowing — tracking boundary, lifecycle hooks off-browser, custom
      elements per window, safe off-browser import, separate server entry.
    - h2 Prerendering (SSG) — one render per page against a fresh window.
- **Code samples:** quick example (660–675), SSG prerender example (821–834).
- **Cross-links:** `hydration` (the client half), `dehydrated-state` (capturing fetched data),
  `activities` (transforms are what settle), `components` (hook timing).

### 11. `hydration` — Client Hydration

- **Source:** Client hydration (README 685–719).
- **Outline:**
    - h2 Settle-and-swap — contrast with `init`, the single atomic swap, no flashes.
    - h2 `hydrate` — props (`ready`, `maxWait`, the rest as `init`).
    - h2 `settled` — the exported signal, test await point.
    - h2 Semantics worth knowing — tracking boundary, pre-swap inertness, lifecycle timing,
      empty-root degradation, tree-shaking, skip-the-refetch pointer.
- **Code samples:** quick example (700–710).
- **Cross-links:** `server-rendering` (produces the markup), `dehydrated-state` (skip the
  refetch), `bootstrapping` (`init` contrast), `activities` (settlement).

### 12. `dehydrated-state` — Dehydrated State

- **Source:** Dehydrated state (README 721–781).
- **Outline:**
    - h2 Paying for data once — the double-fetch gap and the full flow
      (`renderToString` → `dehydrate` → embed → `primeResources` → `hydrate`).
    - h2 API — h3 `resource`; h3 `primeResources`; h3 `dehydrate`; h3 `serializeState` (XSS
      rationale).
    - h2 Example — the three-snippet flow (resource on load, capture + embed, prime + boot).
    - h2 Semantics worth knowing — key namespacing, window-lifetime cache, serializability
      boundary, graceful degradation, byte cost.
- **Code samples:** resource-in-transform (741–746), capture + embed (751–762), prime + boot
  (767–773).
- **Cross-links:** `server-rendering`, `hydration`, `activities` (resource lives inside
  transforms).

### 13. `diagnostics` — Diagnostics

- **Source:** Diagnostics (README 783–795).
- **Outline:**
    - h2 Two lanes — always-on warnings/errors vs. opt-in debug narration.
    - h2 `setDebug` and scopes — `activity`, `creation`, `mutations`, `updates`; boot-time
      equivalents.
    - h2 Semantics worth knowing — real console attribution, gate-read-at-access (don't cache
      method references).
- **Code samples:** none carried (inline signatures only).
- **Cross-links:** `configuration` (`globalConfig.debug`/`debugScope`).

---

## Coverage check

Every consumer-facing README section has a home: intro/highlights/install/inclusion → 1;
bootstrapping → 2; framework configuration → 3; components + simple components → 4; composing
components + element components → 5; custom elements → 6; activities → 7; routing → 8; lazy
imports → 9; server rendering → 10; client hydration → 11; dehydrated state → 12;
diagnostics → 13. Examples: app initialization → 2 + 10; components (all four) → 4; activity →
7; routing → 8. The Recognition section is repo credits, not consumer docs — no topic.

## Open points for map review (task 1.3)

1. The `// @lang` directive convention for code-panel language labels (convention 2) — ratify or
   propose an alternative before task 3.1.
2. Inline-vs-block code split (convention 3) changes current renderer behavior for any existing
   entries using inline code marks — confirm acceptable.
3. Feature-highlight bullets in `getting-started` as topic links (vs. plain text) — confirm.
