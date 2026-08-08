<!-- High-level phases for an exploratory stub — expand each into concrete tasks when this refines (and likely splits). `add-spread-props` is the spun-out prerequisite. -->

## 0. Decisions to close (design.md Open Questions)

- [ ] 0.1 Audit the 8 `is=` sites and 12 value-position sites: which refactor away (the `PinkGridHeader` precedent), which genuinely need element-as-value — decides the `el(tagName)` factory.
- [ ] 0.2 `RouteLink` API (incl. active-state question) and media-utility API shapes for core.
- [ ] 0.3 Resolve or explicitly document the array-reconciliation limitation (fragment-rooted values in children arrays) before pink conversion begins.
- [ ] 0.4 Tags endgame mechanics (delete vs archive; npm deprecation message) and docs sequencing with `add-server-rendering`.

## 1. Prerequisite

- [ ] 1.1 `add-spread-props` implemented and archived.

## 2. Core survivors

- [ ] 2.1 `RouteLink` in core (tree-shakeable, byte-budgeted, TDD per repo workflow).
- [ ] 2.2 Media utilities (`Svg`, `Picture`, `ResponsiveImage`, `Source`) in core; delete the `Text` createTextNode helper (SSR-hostile, trivial).
- [ ] 2.3 `el(tagName)` factory if 0.1 says it earns its bytes.

## 3. Pilot, then full conversion

- [ ] 3.1 Pilot: convert 2–3 representative pink components (one trivial wrapper consumer, one passthrough, one list-heavy); measure pink dist, app bundle, and runtime component-context count before/after; DOM-parity proof per component.
- [ ] 3.2 Full pink conversion (36 files) and app conversion (18 files), component-by-component with parity checks.
- [ ] 3.3 Remove `@loom-js/tags` from pink peerDeps and all first-party imports.

## 4. Retirement & repositioning

- [ ] 4.1 Retire `packages/tags` per 0.4; changesets (pink major, core minor(s)).
- [ ] 4.2 Docs overhaul: core README leads with element syntax; functional form documented as architecture/escape hatch; coordinate with `add-server-rendering` docs.
- [ ] 4.3 Update `.claude/skills/skill-config.md` and `SOLID-AUDIT-REPORT.md` per repo rules.

## 5. Enforcement package

- [ ] 5.1 Lint-plugin package (eslint enforcer rules; GritQL patterns for Biome, lint-only); publish like the esbuild plugin.
