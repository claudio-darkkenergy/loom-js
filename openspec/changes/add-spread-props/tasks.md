## 0. Prerequisites

- [ ] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; re-measure `dist/index.mjs` min+gzip (expected ≈ 9,850 B) and set the **byte budget** for the spread addition.
- [ ] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `compile-component-tags/` (its SRP entry was resolved by the `add-named-slots` split — confirm nothing reopened).

## 1. Specs first (Red)

- [ ] 1.1 Unit specs in `tests/unit/compile-component-tags/`: spread compiles into props; source-order last-wins with named props on both sides; nullish/primitive no-op; `slot` via spread is a prop, not a label; markup `children`/`slots` still win; `...` not before an interpolation throws.
- [ ] 1.2 Integration spec: element-syntax spread renders identically to the functional `Component({ ...object })` form.
- [ ] 1.3 Confirm red for the right reason (the form currently throws), full existing suite untouched.

## 2. Implementation (Green)

- [ ] 2.1 `scanner.ts` attribute region: recognize a chunk ending `...` before an interpolation; carry a pending-spread state analogous to `pendingValueName`.
- [ ] 2.2 `emit.ts`: spreads join the ordered props application (design Decision 2) with JS spread semantics (Decision 3).
- [ ] 2.3 Throw path for `...` misuse per the grammar, naming the construct with surrounding text.

## 3. Verification

- [ ] 3.1 `test-ci`, `type-check`, `type-check-tests` green.
- [ ] 3.2 Measure against the 0.1 byte budget; report the actual number.
- [ ] 3.3 Readability check: collapse `PinkGridHeader`'s enumerated passthrough to `...${…}` and re-run the side-by-side DOM comparison (byte-equal modulo `slot` attributes).
- [ ] 3.4 Prettier `--check` clean on changed files.

## 4. Docs & release

- [ ] 4.1 `packages/core/README.md`: add the spread form to the props table/section.
- [ ] 4.2 Changeset for `@loom-js/core` — minor (additive).
- [ ] 4.3 Update `.claude/skills/skill-config.md` composition notes if the authoring conventions section mentions prop forms.
