<!-- Decisions 5-7 settled 2026-08-04. Section 0 questions must close before section 2 begins. -->

## 0. Prerequisites & open decisions

- [x] 0.1 Resolve **`$` on component tags** — required, forbidden, or meaningful (design Open Questions). Blocks the grammar, so it blocks everything from 2.1 on. Update `proposal.md`'s transform example to match, since it is currently inconsistent with itself. — **Forbidden** (design Decision 8); `proposal.md` examples, the prop-forms bullet, and the spec's "props are passed as attributes" scenario updated to match.
- [x] 0.2 Resolve **`</>` against an empty component stack** — terminate a rootless `<>` fragment, or throw per Decision 6. — **Throws** (design Decision 9); never a fragment terminator, no back-compat break thanks to the fast bail-out.
- [x] 0.3 Write the **accepted grammar** down explicitly before implementing it, per the design's Risks section: quoted vs unquoted attribute values, boolean shorthand, self-closing `/>`, `</>`, and attribute regions that span chunk boundaries. Anything outside it throws (Decision 6). This artifact is the spec the scanner is built and tested against. — Written as the **Accepted Grammar** section in `design.md`.
- [ ] 0.4 Set the **byte budget** for the scanner and state how it is measured (`@loom-js/core` is zero-runtime-dependency; the design requires an explicit budget).
- [ ] 0.5 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `html-parser.ts`, `component.ts`, `get-text-update.ts`, `lib/context/helpers.ts` per the repo Audit Rule. Resolve any critical one before adding code.
- [ ] 0.6 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` all green before touching anything. — type-check and type-check-tests confirmed green 2026-08-04; re-run all three, including `test-ci`, immediately before starting.

## 1. De-risk the context question (do before designing the children compiler)

The Decision 3 correction establishes that array items reconcile through `parentCtx.children` (keyed `props.key ?? index`), **not** through `ctxScopes` (one slot per template function). Both consequences below are unproven and cheap to falsify. Doing this first is what keeps section 3 from being designed against the wrong mechanism a second time.

- [ ] 1.1 Write a failing-or-passing probe in `packages/core/tests/unit/` that renders **N instances of one template function inside a context that carries `ctxScopes`** (i.e. reached from an `activity.effect` scope, not via the array path). Determine whether they collide into a single context. Record the answer in `design.md` regardless of outcome.
- [ ] 1.2 Probe the **key inheritance gap**: a keyed list whose items contain nested child markup, reordered. Establish whether children reconcile by key or fall to the index keyspace while their parents use keys. Extend `tests/unit/activity-array.spec.ts` — it already covers keyed reorder, full reversal, numeric keys, and numeric-key-equals-index (lines 78-165).
- [ ] 1.3 If 1.2 shows a gap, decide whether the transform **forwards the parent's `key`** to synthesized children, synthesizes its own, or leaves children on the index keyspace deliberately. Record as a Decision.

## 2. Specs first (Red)

- [ ] 2.1 Extend `specs/template-component-syntax/spec.md` with scenarios for the settled decisions: `</>` as the single closing form (and that `</${Component}>` / `<//>` are _not_ accepted), throw-on-malformed with the offending construct named, and `key=${…}` reaching `props.key` and participating in keyed reconciliation.
- [ ] 2.2 Add a scenario covering whichever answer 1.3 produces for children-of-keyed-items.
- [ ] 2.3 Write the tests for those scenarios against `@web/test-runner` + chai. Confirm they fail for the expected reason — the transform does not exist — and that nothing else regressed.
- [ ] 2.4 Add the no-op guard test: a template with no component elements produces byte-identical input to `createContextualFragment`. This is the single most important regression test in the change; the whole risk argument rests on it.

## 3. Transform implementation (Green)

- [ ] 3.1 New transform module under `packages/core/src/lib/templating/`. Fast bail-out before any scanning — templates with no component tags must not pay.
- [ ] 3.2 Scanner per the 0.3 grammar: chunk-boundary detection for opening tags (Decision 4), plus the text-scanning rule and open-component stack that `</>` requires (Decision 5).
- [ ] 3.3 Children compilation into synthesized components (Decision 3), honoring the 1.3 outcome for keys. Never emit a nested bare `` html`…` `` — `component.ts:55` binds `html` to a single instance and `html-parser.ts:62` clobbers on a different chunks array.
- [ ] 3.4 Wire into the front of `htmlParser` (`html-parser.ts`). Cache the derived chunks on the existing `templateCacheStore` entry, keyed by the same `TemplateStringsArray` identity (Decision 1); cache the _plan_, not the values (Decision 2).
- [ ] 3.5 Sub-template cache keying: derived sub-chunks live on the parent's cache entry, not in a global keyed store — a chunks slice has no stable `TemplateStringsArray` identity.
- [ ] 3.6 Throw path per Decision 6, naming the construct and including surrounding chunk text.
- [ ] 3.7 Types in `packages/core/src/types.ts` for the transform's inputs/outputs.

## 4. Verification

- [ ] 4.1 `test-ci`, `type-check`, `type-check-tests` green.
- [ ] 4.2 Measure the scanner against the 0.4 byte budget. Report the actual number.
- [ ] 4.3 Hot-path check: confirm no measurable regression for templates without component elements.
- [ ] 4.4 **Readability check** — convert a real `apps/loom` template and show before/after. `apps/loom/src/app/pages/layout.ts` is the proposal's own motivating example; use it. Confirm `apps/loom` still builds and renders unchanged.
- [ ] 4.5 Prettier per `.prettierrc` on all changed files (`--check` clean); let the import-sort plugin handle ordering.

## 5. Docs & release

- [ ] 5.1 Document the syntax in `packages/core/README.md`: element form, the `$` convention as settled in 0.1, `</>` closing, children, `key`, and the error behavior.
- [ ] 5.2 State explicitly that this is **sugar over `${Component({…})}`** with no new runtime semantics, so readers know the two forms are interchangeable.
- [ ] 5.3 Changeset for `@loom-js/core` — **minor** (additive syntax, no existing behavior changes).
- [ ] 5.4 Update `SOLID-AUDIT-REPORT.md` and `.claude/skills/skill-config.md` if the new module changes the `packages/core/src/` public API surface or templating structure (per the repo's Skill Config Rule).

## 6. Deferred / tracked

- [ ] 6.1 **Named slots / `[slot]` content distribution.** Inherited 2026-08-04 from `fix-custom-element-registration` task 6.2. Covers `[slot]` distribution generally, not only the shadow-DOM `<slot>` element, since `defineElement` renders to the light DOM by default. Prior art: Open Questions in `openspec/changes/archive/2026-08-04-fix-custom-element-registration/design.md`. Sequence after section 3 — it is the multi-region counterpart to children compilation and should not reshape that design before it exists.
- [ ] 6.2 **Type-safe attribute values spike** (Decision 7). Time-boxed. Scope: check interpolated _values_ against the component's `Props`, not attribute _names_. Acceptance bar: the editor stays responsive on `apps/loom/src/app/pages/layout.ts`. Abandon on breach rather than pursuing partial wins.
- [ ] 6.3 **Attribute-name type checking** (Decision 7) — deferred, not rejected. Revisit only if 6.2 succeeds and TypeScript 7's instantiation performance proves it viable.
