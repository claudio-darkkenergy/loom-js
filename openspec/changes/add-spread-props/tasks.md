## 0. Prerequisites

- [x] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; re-measure `dist/index.mjs` min+gzip (expected ≈ 9,850 B) and set the **byte budget** for the spread addition. → All green (132 passed); baseline exactly 9,850 B; budget 160 B (ceiling 10,010 B), recorded in design Decision 5.
- [x] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `compile-component-tags/` (its SRP entry was resolved by the `add-named-slots` split — confirm nothing reopened). → Entry is ✅ Resolved (2026-08-07); nothing reopened.

## 1. Specs first (Red)

- [x] 1.1 Unit specs in `tests/unit/compile-component-tags/`: spread compiles into props; source-order last-wins with named props on both sides; nullish/primitive no-op; `slot` via spread is a prop, not a label; markup `children`/`slots` still win; `...` not before an interpolation throws. → `spread.spec.ts` (9 specs).
- [x] 1.2 Integration spec: element-syntax spread renders identically to the functional `Component({ ...object })` form. → added to `rendering.spec.ts`.
- [x] 1.3 Confirm red for the right reason (the form currently throws), full existing suite untouched. → 10 failed, all via the current `unexpected character` throw; existing 132 still pass.

## 2. Implementation (Green)

- [x] 2.1 `scanner.ts` attribute region: recognize a chunk ending `...` before an interpolation; carry a pending-spread state analogous to `pendingValueName`.
- [x] 2.2 `emit.ts`: spreads join the ordered props application (design Decision 2) with JS spread semantics (Decision 3). → spread entries are `[null, getter]` pairs in `frame.props`; `Object.assign` applies them in the existing ordered loop.
- [x] 2.3 Throw path for `...` misuse per the grammar, naming the construct with surrounding text.

## 3. Verification

- [x] 3.1 `test-ci`, `type-check`, `type-check-tests` green. → 142 passed, 0 failed; both type-checks clean.
- [x] 3.2 Measure against the 0.1 byte budget; report the actual number. → 9,944 B — **94 B of the 160 B budget** (ceiling 10,010 B).
- [x] 3.3 Readability check: collapse `PinkGridHeader`'s enumerated passthrough to `...${…}` and re-run the side-by-side DOM comparison (byte-equal modulo `slot` attributes). → collapsed to `...${{ attrs, id, on, style }}` (picked object — the render props arg also carries lifecycle/ref injections, so a rest-spread would leak them); pre/post builds served under puppeteer: `#layout` fully byte-equal, zero page errors.
- [x] 3.4 Prettier `--check` clean on changed files.

## 4. Docs & release

- [x] 4.1 `packages/core/README.md`: add the spread form to the props table/section. → fourth table row + spread-semantics paragraph; errors list gains the `...` misuse case.
- [x] 4.2 Changeset for `@loom-js/core` — minor (additive). → `.changeset/spread-props.md`; plus `.changeset/pink-grid-header-spread.md` (`@loom-js/pink` patch) since the readability check changed published pink source.
- [x] 4.3 Update `.claude/skills/skill-config.md` composition notes if the authoring conventions section mentions prop forms. → spread-props bullet added to the component model notes.
