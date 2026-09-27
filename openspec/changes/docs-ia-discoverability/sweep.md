# Discoverability sweep — docs-ia-discoverability

Swept 2026-09-26 against the published topic sources (`…/2026-09-08-align-loom-docs-with-core-readme/contentful-sync/topics/*.md`, all 13 + `feedback`) and `packages/core/README.md` (HEAD). Rule applied (design D3): only discoverability failures qualify — a concept readers would seek by name that has no heading, sits under a mechanism-titled heading, or is split across sites. Taste restructures get **defer**.

Verdict key: **restructure** (this change) · **defer** (with rationale) · **fine** (as-is). Each **hub** row's site inventory doubles as its See also set (D2b).

## Pre-conditions found during the sweep

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Effect on this change                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Only h2s get anchor ids + TOC entries today (`StyledRichText` HEADING_3 renders a bare `<h3>`; `TopicToc` reads `heading-2` only). `toc-sub-section-links` is 0/7.                                                                                                                                                                                                                                                                                                                                                                                   | h3s are **not** discoverable yet — the h2 is the unit that counts for this change. D1's "h3s navigable via `toc-sub-section-links`" is a promise, not a fact. |
| P2  | Three published cross-links already target h3 anchors and are therefore **dead**: `/docs/element-syntax#the-key-prop` (×2), `/docs/element-syntax#no--sigil-on-component-tags`, `/docs/activities#component-scoped-state` (×2).                                                                                                                                                                                                                                                                                                                      | 4.2's dead-anchor crawl fails on day one unless `toc-sub-section-links` lands first **or** those links retarget h2s. Maintainer call (Q1).                    |
| P3  | Content-map outlines drifted: `hydration` gained h2 "The swap"; `server-rendering` gained h2 "Choosing a DOM implementation"; `diagnostics` gained h2s "The line anatomy" / "Naming subjects with label".                                                                                                                                                                                                                                                                                                                                            | Sync the map outlines in 3.3's map edits (housekeeping, no content change).                                                                                   |
| P4  | Parity drift: README `ActivityOptions` lists `label?: string` (README:990); the `activities` topic's Options list omits it.                                                                                                                                                                                                                                                                                                                                                                                                                          | Add the `label` bullet (pointer → Diagnostics › Naming subjects with label) in 3.3.                                                                           |
| P5  | Parity drift: README › Choosing a DOM implementation says Happy DOM is verified (`server-dom-compat`, 2026-09-20) and carries a jsdom `window.location` note; the `server-rendering` topic still said Happy DOM "does not work today".                                                                                                                                                                                                                                                                                                               | Topic section re-sourced from the README in 3.3.                                                                                                              |
| P6  | Anchor rule: `headingAnchorId` kebab-cases camelCase, so `renderToStringSync` → `#render-to-string-sync` and a `routeProps` h3 → `#route-props`.                                                                                                                                                                                                                                                                                                                                                                                                     | Registry entries below use the split form.                                                                                                                    |
| P7  | Core bug found by the fragments probe (out of scope, reported): under **linkedom** a `<>` token preceded by whitespace leaks into the rendered output as `&lt;&gt;` (jsdom and browsers are fine) — linkedom splits the leading text node, so the parser's `<>` strip misses it. The docs prerender runs on linkedom.                                                                                                                                                                                                                                | Follow-up core change; not this change.                                                                                                                       |
| P8  | Core type gap found by the sample check (out of scope, reported): any callable with **required** props — `component<{ label: string }>`, `simple<{ label: string }>`, a plain function — is rejected in the tag position (`<${X} label=… />`: "not assignable to `TemplateTagValue`"); optional-prop and propless components pass. Cause: `Component<any>` resolves `{} extends any` to the `(props?: …)` branch, and a required-parameter function isn't assignable to an optional-parameter one. Runtime is unaffected; the docs describe runtime. | Follow-up core change (`TemplateTagValue` should admit required-prop component callables); the README/topic examples stay as written.                         |
| P9  | Core type gap (out of scope, reported): `AttrsTemplateTagValue` entries don't admit an `AttrBinding`, although the `reactive-attr-bindings` spec promises bindings inside `$attrs` and the runtime honours them (`isAttrBinding` in the `$attrs` updater). The Element bindings `$attrs` example (`'aria-busy': isBusy.bind(…)`) is spec-correct but fails `tsc` today.                                                                                                                                                                              | Rides the same follow-up core change as P8.                                                                                                                   |

## Seeded candidates

### S1 — Element bindings (the `$` vocabulary) — **restructure** · hub

- **Failure:** heading _and_ coverage gap. `$click`/`$event`, `$attrs`, `$on`, `$props` appear in 8 topics; no heading names them; `$attrs`/`$on`/`$props` semantics are explained nowhere. `$event` surfaces only through Configuration › `appendEvents`.
- **Sites:** Components › Built-in props (`attrs`/`on`/`onClick` bullets say "forward to `$attrs`/`$on`/`$click`"), Components › Attribute and text values (`$attrs` entry of `0`), Element Syntax › No `$` sigil (names the four bindings, one line), Configuration (`$event` set, `appendEvents`), Custom Elements › Passing props (`$`-prefixed CE attributes — the _other_ `$`), Hydration › Pre-swap inertness (`$click` inert until swap), Activities/Routing examples (`$click` in code only).
- **Source semantics (core `get-attr-update.ts`):** `$<event>` for any name in `config.events` (defaults = `GlobalEventHandlers`, extended by `appendEvents`/`globalConfig.events`) → listener on that node, replaced not stacked on re-render; `$attrs=${object}` → per-key apply with the same truthy/falsy/`0` rule, `className`→`class`, `style` string/object/array, entries may be `bind()` values (disposed on re-render swap); non-object → warning, ignored. `$on=${object}` → one listener per known event name, unknown names silently skipped; non-object → warning. `$props=${object}` → JS props on a registered custom element only; on anything else → warning, ignored. Any other `$name`: on a registered custom element → camelCased JS property; on a plain element → treated as the plain attribute `name`. The `$` attribute itself is removed from the DOM after processing.
- **Verdict:** new **Components h2 "Element bindings"** placed right after "Attribute and text values" (both govern real elements), with h3s `$event`, `$attrs`, `$on`, `$props` (h3s for future TOC; the h2 carries discovery today). Closes the coverage gap in the same stroke. Element Syntax › No `$` sigil keeps its rule and gains a one-line pointer; Custom Elements › Passing props gains a disambiguating pointer (CE `$prop` ≠ element binding). README gains the matching `#### Element bindings` under Components.
- **See also set:** Built-in props (`attrs`/`on`/`onClick` forwarding) · Attribute and text values · Element Syntax › No `$` sigil on component tags · Configuration › `appendEvents` · Custom Elements › Passing props from a consuming page · Client Hydration › Semantics (pre-swap inertness, `replayEvents`).
- **Open (Q2):** document the plain-element `$name` fallback, or leave it unstated as an implementation accident?

### S2 — Functional components — **restructure** (D1)

- **Failure:** `simple` lives under a mechanism heading ("Simple components" / README "(pass-through)"); the plain-function contract lives only in the `SuperButton` example comment (Components › Examples › Props and interpolation; README:1677–1682).
- **Sites:** Components › Simple components (h2), Components › Examples › Props and interpolation (comment block + trailing "`simple` wraps exactly this pattern" comment), Components › Using components ¶1 (defines "a `ContextFunction` renders wherever a template accepts a value"), Element Syntax › No `$` sigil (`ConfirmChip`/`SaveButton` `simple` examples).
- **Verdict:** Components **h2 "Functional components"** replacing the "Simple components" h2, with h3 "Plain functions" (the contract: any function returning a `ContextFunction` is a component; the `SuperButton` example moves here from the examples comment; names `ContextFunction` by heading-adjacent prose — see N1) and h3 "Simple components" (current body). Order: Plain functions first (the contract), Simple components second (the typed wrapper over it). Anchor `#simple-components` retires → redirect note in the map (no inbound links found in topics, README or app).
- **Not a topic:** two patterns + one contract; D1 stands.

### S3 — Fragments — **restructure** (D2) · hub → new topic `fragments`

- **Failure:** split across sites; no heading anywhere names the concept; review shed nuance bugs one at a time.
- **Sites (the many-to-one source map):** Components › Defining a component ¶3 (single-root rule + fragment exception + top-level-interpolation rule); Components › The template function `html` bullet (pointer); Components › Built-in props › `node()` ("or node group"); Components › Examples › Accessing the rendered node (`Pair` — hook handlers receive an array); Element Syntax › Composing in markup (component-tags-only inference, `<>` prefix, lone-value rule); Element Syntax › Markup vs. the functional form last ¶ (fragment-rooted values travel as one group); Element Syntax › No `$` sigil ("a fragment root has none"); Element Syntax › The `key` prop last ¶ (keyed fragment-rooted item moves as one group); Element Syntax › Named slots ¶ after functional form (a region "renders as its own unit… like any fragment"). Core spec source: `fragment-array-reconciliation` (archived 2026-08-18).
- **Homonyms to disambiguate in the lead:** Routing's URL `#fragment` and Server Rendering's "fragments" (HTML snippets for `renderToStringSync`) are different senses — the topic opens by saying so.
- **Verdict:** new topic, slug `fragments`, title "Fragments", Templating group, between `element-syntax` and `custom-elements`. Draft h2 outline: The `<>` token · Root forms and inference (single root / `<>` / component-tags-only inference / lone interpolation needs `<>`) · Fragments as values (node arrays from `node()` and hook handlers; travel as one group anywhere a value goes; children arrays) · Keyed reconciliation (move-as-group, node identity, truncation, kind change, empty-group anchor — from the core spec) · Named regions are fragments (slots pointer) · See also. Vacating sites keep one-line pointers; Components' single-root paragraph and Element Syntax' inference paragraph keep their local rule (they're where the reader hits the error) and link.
- **See also set:** Components › Defining a component · Components › Built-in props (`node()`) · Components › Examples › Accessing the rendered node · Element Syntax › Composing in markup · Element Syntax › Markup vs. the functional form · Element Syntax › The `key` prop · Element Syntax › Named slots · Element Syntax › No `$` sigil on component tags.

### S4 — The settlement signal — **restructure** (concept home) · hub

- **Failure:** named in 9 topics (Getting Started, Activities ×4, Routing, Lazy Imports, Server Rendering ×3, Hydration ×5, Dehydrated State, Diagnostics ×2), first met in Activities › Transforms, but the only heading is **Client Hydration › `settled`** (the API entry). The concept — what counts as tracked, the tracking boundary, who gates on it — is duplicated as unlinked bullets in Hydration › Semantics and Server Rendering › Semantics, and echoed in Activities › Transform concurrency ("one boundary to know") and Routing › Hash navigation ("outside the tracking boundary").
- **Verdict:** **Activities h2 "The settlement signal"** after "Transform concurrency" and before "Options": what it is, what it tracks (transform thenables → lazy imports, route pages, `resource`), the tracking boundary (raw `fetch` in `watch`, `setTimeout` are invisible → `ready`), the one-macrotask quiet rule, who waits on it (`renderToString`, `hydrate`, hash scroll, `settled()` in tests). Hydration › `settled` keeps the API entry and links up; the two Semantics bullets shrink to a pointer + their topic-specific consequence. README gains `#### The settlement signal` under Activities.
- **Alternative rejected:** renaming Hydration's `settled` h2 — anchor churn, and the learning path meets the concept four topics earlier.
- **See also set:** Activities › Transforms · Activities › Transform concurrency (`timeout`, `signal`) · Lazy Imports · Routing › Hash and anchor navigation · Server Rendering › `renderToString` (`maxWait`) · Client Hydration › `settled` · Client Hydration › Semantics (tracking boundary, `ready`) · Dehydrated State › `resource` · Diagnostics › Naming subjects with label (pending enumeration).
- **Q3:** agree Activities is the home (vs. Hydration owning both API + concept)?

### S5 — Transform time — **restructure** (small)

- **Failure:** Element Syntax relies on the phrase five times (labels resolve / `slot` consumed / throws "at transform time") and "Composing in markup" describes the mechanism ("sugar over the functional form… before the native parser… once per call site, cached") without owning the term; Errors says "first render", which is the same moment but never said to be.
- **Verdict:** new **Element Syntax h2 "Transform time"** immediately after "Composing in markup": the transform is the phase that rewrites component tags into calls; it runs once per template call site on that site's first render, before the native parser, and is cached; consequences — slot labels resolve then, `slot` on component tags is consumed then, malformed syntax throws then (so "throws at transform time" ≡ "throws on first render"). Errors gains a pointer. README gains the matching h4.

### S6 — `el()` — **fine** (+ one link)

- Heading exists: Element Syntax › Element components › `el(tagName)` (h3; h2 "Element components" carries TOC discovery). The value-position mention in "Markup vs. the functional form" gains an inline link to the h3 once P1 resolves (or to `#element-components` now).

### S7 — Reserved props — **fine**

- Built-in props h2 (via `document-component-refs`) is the hub with its own See also; S1 adds "Element bindings" to that set.

### S8 — Rich-text / authoring conventions — **fine**

- Docs-internal (content map); not reader-facing.

## New candidates from the sweep

### N1 — `ContextFunction` — **restructure** (folded into S2, no new heading)

- Appears in 9 topics' signatures (`app: ContextFunction`, `fallback`, `renderToString(app: ContextFunction…)`, `heading: ContextFunction`); defined only in prose at Components › Using components ¶1. S2's "Plain functions" h3 owns the contract sentence — name the type there, bold-led, and have Using components ¶1 link to it. A glossary is out of scope.

### N2 — `routeProps` / `RouteValue` — **restructure** (small)

- Routing has no heading for how a page reads its route: the answer is a lone paragraph after the Quick Example ("Pages receive the matched route as `routeProps`"), and `RouteValue`'s shape is described twice inside other bullets (`guard`, `routeEffect`). Built-in props › `routeProps` points at bare `/docs/routing`. Verdict: promote the paragraph to **h3 `routeProps`** under API (after `RouteLink`) with the `RouteValue` shape; the guard/routeEffect bullets reference it; Built-in props links to `#api` today (h2) and the h3 once P1 resolves.

### N3 — Component-scoped state — **restructure** (promotion)

- A concept (the `own` depth Built-in props points at) sits as an h3 under Activities › **Examples**, so the TOC shows only "Examples". Promote to **h2 "Component-scoped state"** after "The returned interface" (before Examples). Fixes one of P2's dead anchors by making `#component-scoped-state` an h2 id.

### N4 — What can be interpolated (`TemplateTagValue`) — **defer**

- "Any interpolatable `TemplateTagValue`" (Activities › effect, Routing) has no home listing the accepted value kinds (strings/numbers, nodes, `ContextFunction`s, arrays, `bind()` values, the falsy rule). Components › Attribute and text values covers the falsy half. Deferred: this is coverage authoring from source (a new section with examples), not a heading fix; candidate for a `docs-interpolation-values` follow-up or the `readme-slim-down` re-anchoring pass.

### N5 — Tracking boundary — folded into **S4**

- A sub-concept of the settlement signal; gets its named paragraph inside S4's section.

### N6 — "Component context" / "template context" — **defer**

- Used (Components › Defining, Element Syntax › Children, Simple components) never defined. It's an internal mechanism; a heading would document internals. Leave; revisit if a debugging-oriented topic ever exists.

### N7 — "Semantics worth knowing" catch-alls — **fine** (pattern accepted)

- Four topics end with bold-led bullet lists under this heading. The bullets are consequences, not concepts; promoting them would fragment the topics. Concepts that _were_ hiding there (tracking boundary) are handled by S4.

### N8 — `label` option missing from Activities › Options — parity fix (P4) — **restructure** (bullet)

## Per-topic pass (coverage of the 13 + feedback)

| Topic            | Candidates                           | Verdict summary                                                                                                          |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| getting-started  | none                                 | fine                                                                                                                     |
| bootstrapping    | `Placement` inline in `AppInitProps` | fine — union is in the bullet; h2 `AppInitProps` finds it                                                                |
| configuration    | `$event` defined by implication      | fine after S1 (link from Element bindings)                                                                               |
| components       | S1, S2, S3 pointers, N1              | restructure: + Element bindings h2, Functional components h2 (h3 Plain functions / Simple components), fragment pointers |
| element-syntax   | S3 pointers, S5, S6 link             | restructure: + Transform time h2; fragment pointers; `el()` link                                                         |
| custom-elements  | `$` disambiguation                   | pointer only (S1)                                                                                                        |
| activities       | S4, N3, N8                           | restructure: + The settlement signal h2; Component-scoped state → h2; `label` bullet                                     |
| routing          | N2; "fragment" homonym               | restructure: + `routeProps` h3; one-word disambiguation via S3's lead                                                    |
| lazy-imports     | none                                 | fine (links to S4's home)                                                                                                |
| server-rendering | S4 duplication; P3                   | pointer to S4; map outline sync                                                                                          |
| hydration        | S4 (API stays), P3                   | `settled` h2 keeps API, links up; Semantics bullet shrinks; map sync                                                     |
| dehydrated-state | none                                 | fine (links to S4's home)                                                                                                |
| diagnostics      | P3                                   | map outline sync                                                                                                         |
| feedback         | none                                 | fine (utility topic, outside parity)                                                                                     |

## Cross-link registry additions (for the map)

- New anchors: `/docs/components#element-bindings`, `/docs/components#functional-components`, `/docs/element-syntax#transform-time`, `/docs/activities#the-settlement-signal`, `/docs/activities#component-scoped-state` (h2 now), `/docs/fragments` (+ its h2s), `/docs/routing#route-props` (h3 — P1, P6).
- Retired anchor: `/docs/components#simple-components` → redirect note → `#functional-components`.
- See also sets: S1, S3, S4 above (Built-in props' existing set gains Element bindings).

## Review outcome (2026-09-26)

- **Q1:** `toc-sub-section-links` lands before 4.2 — the h3 anchors in the registry stay as written.
- **Q2:** the plain-element `$name` → attribute fallback stays unstated; the section defines `$` as the four bindings plus event names.
- **Q3:** Activities owns "The settlement signal"; Hydration keeps the `settled` API entry.
- **Q4:** both promotions approved (`routeProps` h3, Component-scoped state h2).
- **Q5:** slug `fragments` and the draft h2 outline approved.

## Questions for review (as asked)

- **Q1 (P2):** dead h3 anchors — land `toc-sub-section-links` before 4.2, or retarget the five links to h2s now?
- **Q2 (S1):** document the plain-element `$name` → attribute fallback, or leave it unstated?
- **Q3 (S4):** Activities as the settlement signal's concept home (Hydration keeps the `settled` API entry)?
- **Q4 (N2, N3):** approve the two small promotions, or defer as taste?
- **Q5 (S3):** slug `fragments` confirmed; any objection to the draft h2 outline?
