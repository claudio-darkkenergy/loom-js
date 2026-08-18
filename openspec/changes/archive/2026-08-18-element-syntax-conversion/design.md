## Context

Every prerequisite is archived: `add-template-component-syntax` (element syntax), `add-named-slots`, `add-spread-props`, `add-core-element-components` (`RouteLink`, `Svg`, `Picture`, `el()`), `fix-router-activation-policy`. The 2026-08-10 audit (recorded in the umbrella's Decision 4) classified all 89 tags call sites; the umbrella's Decisions 4–8 settled the patterns, and `PinkGridHeader` + `PageLayout` are the living precedent for both the conversion shape and the DOM-parity proof.

## Goals / Non-Goals

**Goals:**

- Zero `@loom-js/tags` imports in first-party code; the package deleted; pink majored.
- Per-component DOM parity — the puppeteer harness from `add-named-slots` 4.3, byte-equal modulo `slot` attributes.
- The pilot captures the context-count reduction the whole effort exists for.

**Non-Goals:**

- The lint package (umbrella section 5).
- Core runtime changes of any kind.
- API redesigns beyond what conversion forces (data-shaped APIs like `PinkTopNav`'s `items=` stay data-shaped).

## Decisions

### Decision 1: Conversion patterns are fixed by the audit — one per category

- **Children-prop composition (55 sites):** the host becomes a template `component()`; nested wrapper calls become markup; labelled regions use named slots. Regions interpolate in templates — never as children-array items (the documented array limitation).
- **Amendment (pilot 1.2, 2026-08-11): pure delegators stay functional.** A component with no markup of its own (`PinkContainer`-shaped: one `is(...)` call forwarding props) does NOT become a template — forwarding an arbitrary `children` value through a compiled `<${is}>${children}</>` children region routes caller-supplied arrays into the synthesized-fragment path and trips the array limitation (`[object Text]…` stringify, caught by the root-page parity harness). The delegator stays a `SimpleComponent` over `is = el('tag')`: zero added contexts, the old data path exactly. Template conversion is for components that own actual structure.
- **`is=` polymorphism (10 sites):** the `is` prop survives, typed `Component`; defaults change from tags wrappers to `el('div')`/`el('ul')`/etc.; call sites compose `<${is} …>` or keep the functional call where the site is value-shaped.
- **`item:`/`ListItems` render props (9 sites):** `Ul`/`Ol` hosts become templates owning `<ul>`/`<ol>` markup; the per-item callback becomes an authored `.map` whose return is a component call (functional form — the sanctioned value position).
- **Transformers and third-party callbacks (residue):** `withIcon`/`withTooltip` build their icon/tooltip span via `el('span')`; `StyledRichText`'s `renderNode` returns `el('h1')`…`el('h4')` calls; `docs/index.ts`'s effect returns `el('aside')({…})`.
- **Effects and maps otherwise keep the functional form** — that is architecture, not debt.

### Decision 2: Pilot components and metrics

Pilot trio, one per dominant shape: **`PinkBox`** (trivial `Div` wrapper), **`PinkContainer`** (`is=` passthrough with app consumers), **`PinkTopNav`** (list-heavy, `items=` data API, already slot-labelled in `PageLayout`). Metrics captured before/after on the app root page: `pink` dist min+gzip, app bundle total bytes, and **runtime component-context count** — measured by temporary instrumentation (a counter incremented per context creation in a local core build, read from the parity harness; the instrumentation never lands). DOM parity per component via the established harness.

### Decision 3: Retirement mechanics

Order: pink conversion (peerDep drop last) → app conversion → `ContentfulRichText` gets a local `mergeAllowedAttrs` copy (one consumer; core is not gaining a props-to-attrs util that element syntax exists to obsolete) → delete `packages/tags` + prune `.prettierrc` `packageJSONFiles` and `CLAUDE.md` → owner runs `npm deprecate '@loom-js/tags'` (needs npm auth — recorded as an owner step with suggested message text in tasks).

### Decision 4: Pink majors once, at the end

One changeset describing the composition-API break and the peerDep removal; per-component breaking notes accumulate in it as sections land. No interim pink releases mid-conversion (`main` publishes on merge — this branch holds until the change completes).

## Risks / Trade-offs

- **[Scale: 43 files]** → strict per-component increments with parity proof before moving on; sections ordered so pink leaf components go before their pink consumers.
- **[Storybook stories exercise old APIs]** → stories update with their component in the same increment; `*.stories.*` are excluded from app-build inputs so cache noise stays down.
- **[Array-limitation regressions]** → the one forbidden shape (region values inside children arrays) is named in every conversion section; parity harness catches the stringify symptom (`[object …]` text).
- **[Uncommitted `fix-docs-toc-duplication` WIP overlaps `apps/loom`]** → app conversion coordinates with the owner before touching files that WIP holds open.

## Final Metrics (5.4, recorded 2026-08-12)

| Metric                          |     Before |                                   After | Delta                 |
| ------------------------------- | ---------: | --------------------------------------: | --------------------- |
| Runtime component contexts, `/` |        106 |                                  **86** | **−20 (−19%)**        |
| App bundle (all JS, gzip −9)    |   34,246 B |                                35,688 B | +1,442 B              |
| Pink dist (min+gzip)            |    3,328 B |                                 4,222 B | +894 B                |
| `@loom-js/tags` in first-party  | 89 sites\* |                                       0 | package deleted       |
| Core suite                      |  169 green | 170 green (+`el()` `onClick` red-green) | all type-checks clean |

\* Plus the lib/ scope the audit missed (`lib/contentful`, `lib/storybook`, the workspace example app).

**Reading the numbers:** the context reduction is the effort's thesis and it delivered — every converted wrapper context (one per tags element) is gone; what remains is one context per authored template. The byte costs moved rather than vanished: pink and the app now own their template strings instead of sharing tags' generic machinery, so pink dist grew, and the app bundle nets +1,442 B after the tags code (including the copy that had been riding in through `lib/contentful`'s renderers, invisible to the original audit) tree-shook out. Every step of the conversion is DOM-parity-proven byte-equal (`#layout` on `/`, plus `/docs/get-started` against live content).

## Open Questions

None blocking — patterns, pilot, metrics, and retirement mechanics are all settled above; anything the pilot falsifies comes back here before the full sweep.
