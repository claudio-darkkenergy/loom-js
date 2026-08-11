## Why

`element-syntax-first` (design Decisions 4–6, closed 2026-08-10) settled that the kit-agnostic survivors of the `@loom-js/tags` retirement live in `@loom-js/core` — and the pink/app conversion cannot start until they exist. The 2026-08-10 audit grounded exactly what survives: a fresh `RouteLink` (the router's natural companion — tags' `Link` merely defaulted attrs and made callers pass `route`), the two media utilities with real behavior (`Svg`, `Picture`), and a memoized `el(tagName)` factory for the audited element-as-value residue (`is=` polymorphism, third-party render callbacks, props transformers — 9 sites in 6 files that no markup refactor can absorb).

## What Changes

- **`RouteLink`** in core: composes an `<a>` that performs SPA routing via the core router with no caller-supplied handler. Minimal v1 per Decision 5 — `href`, children/slots, internal `route()` wiring; `target="_blank"` and external hrefs pass through without SPA hijack. No active-state affordance (deferred, additive later).
- **`Svg`** in core: ported as-is from tags — sprite composition via `path` + `svgId` (`href="${path}#${svgId}"`), `size`/`height`/`width`, `fill="currentColor"`.
- **`Picture`** in core: `<picture>` with `sources` + img props; **absorbs `ResponsiveImage`'s chooser** — no `sources` renders a bare `<img>`. `Source` is internal, its props exported as a type. Tags' standalone `ResponsiveImage`/`Source` exports are not ported (zero first-party uses).
- **`el(tagName)`** in core: a memoized factory returning a plain-tag `Component` — element-as-value for `is=${el('footer')}`, render callbacks (`el('h2')({ children })`), and props transformers. One small export standing in for all ~33 pure tag wrappers.
- All additions are tree-shakeable named exports, each with its own byte budget set against the measured baseline (repo budget discipline), developed TDD per the repo workflow.

Non-goals: converting pink/app off tags (the follow-up conversion change); porting `Text`, `ListItems`, `mergeAllowedAttrs`, or any pure wrapper; active-state on `RouteLink`; changes to router or templating requirements.

## Capabilities

### New Capabilities

- `core-element-components`: core's kit-agnostic element-level components — `RouteLink` (self-wired SPA routing), `Svg` and `Picture` (media), and the `el(tagName)` factory (plain tag as a callable component value).

### Modified Capabilities

<!-- None — RouteLink builds on the existing router surface and el()/media on component(); no existing spec's requirements change. -->

## Impact

- **Code:** `packages/core/src/` gains the new modules (grouped under an `elements/` folder, re-exported from `index.ts`); specs under `packages/core/tests/unit/`; `packages/core/README.md` gains an "Element components" section.
- **Risk:** Low — purely additive to core; nothing imports the new exports yet. Hot-path untouched (no templating/scanner changes). Byte cost is the main guardrail: budgets per addition set in tasks section 0.
- **Release:** Minor changeset for `@loom-js/core`.
- **Follow-ups unblocked:** the pink/app conversion + tags retirement change consumes these; `element-syntax-first` umbrella tracks the sequence.
