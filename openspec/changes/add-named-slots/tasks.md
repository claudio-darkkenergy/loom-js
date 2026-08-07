<!-- Section 0 decisions must close before section 2 begins — same discipline as add-template-component-syntax, whose design.md Decisions 3-10 and Accepted Grammar are the foundation here. -->

## 0. Prerequisites & open decisions

- [ ] 0.1 Resolve the **component-side contract** — how a component template addresses a named region (a `slots` prop of per-region `ContextFunction`s, reserved `<slot name>` markers loom replaces, or `children` plus a helper). Blocks everything; also determines the shadow pass-through mechanics (design Decision 2) and the functional form's shape (0.3). Record as a Decision.
- [ ] 0.2 Write the **slot-label grammar** down explicitly: where `slot="name"` is recognized (top-level region elements only, or nested), whether `slot=${name}` interpolated labels are accepted, and what throws. This extends the parent change's Accepted Grammar and is the artifact the scanner extension is built against.
- [ ] 0.3 Resolve **functional-form symmetry** — the `Component({ … })` equivalent for named regions, so the two composition forms remain interchangeable sugar. Record as a Decision.
- [ ] 0.4 Set the **byte budget** against the post-parent baseline (8,987 B min+gzip for `dist/index.mjs`, measured as `pnpm -F @loom-js/core build-package` then `esbuild dist/index.mjs --minify | gzip -9 | wc -c`). The parent's budget has no headroom left; this change needs its own number.
- [ ] 0.5 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `compile-component-tags.ts`, `component.ts`, `define-element.ts` per the repo Audit Rule (note: `compile-component-tags.ts` carries a 🟢 Minor SRP entry — revisit it if this change grows the file).
- [ ] 0.6 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` all green immediately before starting.

## 1. De-risk the shadow boundary

- [ ] 1.1 Probe how `[slot]`-labelled children flow through a `shadow`-enabled `defineElement` component **today** (children arrive as a synthesized fragment component — do its rendered nodes land as direct children of the host, where native `<slot>` can claim them?). The 0.1 contract must not break this path; record the answer in `design.md` regardless of outcome.

## 2. Specs first (Red)

- [ ] 2.1 Extend `specs/named-slots/spec.md` with scenarios for the 0.1 contract and 0.2 grammar as settled (including the throw cases).
- [ ] 2.2 Write the tests against `@web/test-runner` + chai; confirm they fail because distribution does not exist, and that nothing else regressed — including the parent change's no-op guard and the full `template-component-syntax` suite.

## 3. Implementation (Green)

- [ ] 3.1 Extend the children-region compilation in `compile-component-tags.ts`: group by slot label per the 0.2 grammar, one synthesized component per named region plus the unlabelled remainder (design Decision 1). Slot grouping must cost nothing for regions containing no `slot=` labels.
- [ ] 3.2 Deliver regions to the component per the 0.1 contract (`component.ts` / `types.ts` as needed).
- [ ] 3.3 Shadow pass-through per design Decision 2, honoring the 1.1 probe result.
- [ ] 3.4 Functional-form API per 0.3.
- [ ] 3.5 Throw path for malformed slot usage, naming the construct with surrounding text (parent Decision 6 discipline).

## 4. Verification

- [ ] 4.1 `test-ci`, `type-check`, `type-check-tests` green — including the entire parent-change suite untouched.
- [ ] 4.2 Measure against the 0.4 byte budget; report the actual number.
- [ ] 4.3 **Readability check** — convert `PinkGridHeader`'s `gridCol1`/`gridCol2` object-prop plumbing (the motivating example, `apps/loom/src/app/pages/layout.ts` consuming it) to named slots; prove the app renders unchanged with the same before/after DOM comparison the parent change used.
- [ ] 4.4 Prettier per `.prettierrc` on all changed files (`--check` clean).

## 5. Docs & release

- [ ] 5.1 Document named slots in `packages/core/README.md`, extending the "Composing components (element syntax)" section.
- [ ] 5.2 Changeset for `@loom-js/core` — minor (additive).
- [ ] 5.3 Update `SOLID-AUDIT-REPORT.md` and `.claude/skills/skill-config.md` if the templating structure or public API surface changes (repo Skill Config Rule).
