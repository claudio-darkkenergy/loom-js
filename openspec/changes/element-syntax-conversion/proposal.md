## Why

The mechanism (element syntax + named slots + spread props) and the survivors (`RouteLink`, `Svg`, `Picture`, `el()`) have all landed; what remains of `element-syntax-first`'s core direction is the migration itself. Pink pays a full component context per HTML element on nearly everything it renders, first-party code speaks two attribute APIs for the same concepts, and `@loom-js/tags` exists solely to serve a limitation that no longer exists. The 2026-08-10 audit mapped every consuming site (89 call sites, 43 files) and each has a settled conversion pattern — the work is now mechanical, gated by per-component DOM-parity proofs.

## What Changes

- **Pilot first** (umbrella task 3.1): convert 2–3 representative pink components — one trivial wrapper consumer, one `is=` passthrough, one list-heavy — and capture the metrics that decide nothing but prove the thesis: pink dist size, app bundle size, and the runtime component-context count before/after.
- **Full conversion**: all 27 pink files and 16 app files with tags invocations, component-by-component, each conversion following its audited pattern: children-prop composition → markup; `is=` values → `el('tag')` (the `is` prop itself survives); `item:`/`ListItems` render props → authors own their loops; effects/maps keep the functional form (the sanctioned escape hatch); `withIcon`/`withTooltip` transformers and third-party callbacks (`StyledRichText`) → `el()`.
- **BREAKING (pink):** children-prop composition APIs become markup children/named slots where a component's contract changes shape (the `PinkGridHeader` precedent); `@loom-js/tags` leaves pink's peerDeps.
- **Tags retires** (umbrella Decision 8): `packages/tags` is deleted once zero first-party imports remain; published versions get `npm deprecate` pointing to element syntax and the core survivors; `.prettierrc`'s `packageJSONFiles` and `CLAUDE.md` drop their tags entries. The app's lone `mergeAllowedAttrs` consumer (`ContentfulRichText`) gets a local copy of the helper.
- **Docs reposition** (umbrella tasks 4.2/4.3): the core README leads with element syntax and presents the functional form as the underlying architecture and escape hatch; `.claude/skills/skill-config.md` follows.

Non-goals: the lint-enforcement package (umbrella section 5, its own change); any core runtime change (the array-limitation stays documented-deferred per umbrella Decision 7); redesigning pink component APIs beyond what the conversion itself requires.

## Capabilities

### New Capabilities

- `element-syntax-authoring`: element syntax is the primary authoring surface — first-party UI code authors composition in markup, and the tags wrapper layer is retired. (This concretizes the umbrella's draft spec; the umbrella's copy should be pruned when it archives so ownership stays single.)

### Modified Capabilities

<!-- None — core capabilities are untouched; this change consumes them. -->

## Impact

- **Code:** all of `packages/pink/src`, 16 files in `apps/loom/src`, deletion of `packages/tags`, `.prettierrc`, `CLAUDE.md`, `packages/core/README.md`, `.claude/skills/skill-config.md`.
- **Risk:** Broad but incremental — per-component conversion with the established puppeteer DOM-parity harness; tags deletes only at zero imports. The known trap is the array-reconciliation limitation (fragment-rooted values as children-array items stringify) — the conversion pattern interpolates regions in templates, which avoids it.
- **Release:** **Major** for `@loom-js/pink`; the tags retirement is its final (deprecation) act — no version bump, an `npm deprecate` on existing versions. The app is private.
- **Sequencing:** independent of `add-server-rendering` except docs (this change's README repositioning lands first, per umbrella Decision 8). The uncommitted `fix-docs-toc-duplication` WIP touches `apps/loom` — coordinate before converting the files it holds open.
