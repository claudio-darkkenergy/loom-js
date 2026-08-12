<!-- High-level phases for an exploratory stub — expand each into concrete tasks when this refines (and likely splits). `add-spread-props` is the spun-out prerequisite. -->

## 0. Decisions to close (design.md Open Questions)

- [x] 0.1 Audit the 8 `is=` sites and 12 value-position sites: which refactor away (the `PinkGridHeader` precedent), which genuinely need element-as-value — decides the `el(tagName)` factory. → Full-tree audit found 89 sites/43 files; residue is 9 sites in 3 shapes, all "plain tag as callable value" — `el()` confirmed (design Decision 4).
- [x] 0.2 `RouteLink` API (incl. active-state question) and media-utility API shapes for core. → RouteLink v1 minimal, no active-state (Decision 5); media = `Svg` + `Picture` with merged chooser, `Source` as type, drop unused exports (Decision 6).
- [x] 0.3 Resolve or explicitly document the array-reconciliation limitation (fragment-rooted values in children arrays) before pink conversion begins. → Documented as unsupported, fix deferred (Decision 7); conversion pattern avoids the path.
- [x] 0.4 Tags endgame mechanics (delete vs archive; npm deprecation message) and docs sequencing with `add-server-rendering`. → Delete + npm deprecate; docs overhaul first, SSR rebases; remaining work splits into concrete changes (Decision 8).

## 1. Prerequisite

- [x] 1.1 `add-spread-props` implemented and archived. → landed 2026-08-08 (94 B of its 160 B budget), archived as `2026-08-08-add-spread-props`.

## 2. Core survivors

- [x] 2.1 `RouteLink` in core (tree-shakeable, byte-budgeted, TDD per repo workflow). → landed via `2026-08-10-add-core-element-components` (134 B of 256 B).
- [x] 2.2 Media utilities (`Svg`, `Picture`, `ResponsiveImage`, `Source`) in core; delete the `Text` createTextNode helper (SSR-hostile, trivial). → `Svg` + `Picture` landed per Decision 6 (`ResponsiveImage` chooser merged into `Picture`, `Source` as type; Svg 150 B / Picture 214 B). `Text` has zero uses — its deletion folds into 4.1's whole-package removal rather than a separate edit.
- [x] 2.3 `el(tagName)` factory if 0.1 says it earns its bytes. → 0.1 said yes; landed (132 B of 256 B). Note the tree-shaking convention it forced: `/* @__PURE__ */` on top-level `component()` definitions (see the archived change's design Findings).

## 3. Pilot, then full conversion

- [x] 3.1 Pilot: convert 2–3 representative pink components (one trivial wrapper consumer, one passthrough, one list-heavy); measure pink dist, app bundle, and runtime component-context count before/after; DOM-parity proof per component. → Done in `element-syntax-conversion` sections 0–1 (PinkBox / PinkContainer / PinkTopNav; one pattern falsified and amended: pure delegators stay functional).
- [x] 3.2 Full pink conversion (36 files) and app conversion (18 files), component-by-component with parity checks. → Done in `element-syntax-conversion` sections 2–3, plus lib/ scope the audit missed (`lib/contentful` renderers, `lib/storybook` fixture, the workspace example app). Every step byte-equal (`/` and a live-content docs route).
- [x] 3.3 Remove `@loom-js/tags` from pink peerDeps and all first-party imports. → Done (`element-syntax-conversion` 4.1; the dep lived in pink `dependencies`, not peerDeps).

## 4. Retirement & repositioning

- [x] 4.1 Retire `packages/tags` per 0.4; changesets (pink major, core minor(s)). → Package deleted; changesets landed (pink major + core minor for the `el()` flat-surface widening); `npm deprecate` remains the owner step, exact text in the pink changeset.
- [x] 4.2 Docs overhaul: core README leads with element syntax; functional form documented as architecture/escape hatch; coordinate with `add-server-rendering` docs. → README already led with element syntax post-prerequisites; the explicit markup-first positioning (+ the two array-limitation composition constraints) added in `element-syntax-conversion` 5.1. SSR docs rebase on this per Decision 8.
- [x] 4.3 Update `.claude/skills/skill-config.md` and `SOLID-AUDIT-REPORT.md` per repo rules. → skill-config: tags rows pruned + markup-first authoring convention with the conversion patterns; audit report: pink-button LSP 🟡, pink/types ISP 🟢, and pink-code-panel-content SRP 🟢 all ✅.

**Archive note (from `element-syntax-conversion` 5.5):** this umbrella's `specs/element-syntax-authoring/` draft is superseded by the delta spec that landed with `element-syntax-conversion` — prune the umbrella's copy at archive time so capability ownership stays single.

## 5. Enforcement package

- [ ] 5.1 Lint-plugin package (eslint enforcer rules; GritQL patterns for Biome, lint-only); publish like the esbuild plugin.
