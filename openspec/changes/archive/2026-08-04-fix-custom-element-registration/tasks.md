## 0. Prerequisites

- [x] 0.1 Confirm maintainer decision on **D2 — light DOM as the default** for `defineElement`. — Confirmed 2026-08-02: light DOM. Registration (`defineElement`) and encapsulation (`options.shadow`) are separate opt-ins; choosing the first must not impose the second.
- [x] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `component.ts`, `register-custom-element.ts`, `get-attr-update.ts`, `mount.ts` per the Audit Rule. — Verified at proposal time: no entries for any of these files. Re-confirm before editing.
- [x] 0.3 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` all green before touching anything.

## 1. Specs first (Red)

- [x] 1.1 Rewrite `packages/core/tests/unit/custom-element.spec.ts` against the `defineElement` API. Give **every** case a unique element name — `customElements.define` is process-global and irreversible, so no element name may be reused across `it` blocks.
- [x] 1.2 Add the case asserting `component((html, props) => …)` and `component(function Named(…))` both define **no** custom element (`customElements.get('named')` is `undefined`). This is the requirement that the old behavior is gone.
- [x] 1.3 Add cases for: `$`-attribute → camelCase prop mapping; `$prop=${objectOrFunction}` arriving uncoerced via `setCustomElementProps`; children pass-through; a `<>…</>` fragment root mounting all roots in order (regression guard — this works today).
- [x] 1.4 Add cases for both shadow modes — default (light DOM, `host.shadowRoot === null`, content is a direct child) and `{ shadow: { mode: 'open' } }` (`host.shadowRoot` non-null and reachable).
- [x] 1.5 Add cases for invalid name (no hyphen) and duplicate registration, each expected to throw an error naming the element.
- [x] 1.6 Run `test-ci`; confirm the new cases fail for the expected reason (`defineElement` does not exist yet) and nothing else regressed.

## 2. Implement `defineElement`

- [x] 2.1 New `packages/core/src/define-element.ts` — `defineElement(name, templateFunction, options?)` calling `component()` then `registerCustomElement()`, returning the resulting `Component<Props>`. Type the `templateFunction` param as `TemplateFunction` only, so `SimpleComponent`'s `ContextFunction[]` return is excluded by construction (D5).
- [x] 2.2 Add the `DefineElementOptions` type (`shadow?: ShadowRootInit | false`, `styles?: CSSStyleSheet[]`) to `src/types.ts`; export `defineElement` and the options type from `src/index.ts`.
- [x] 2.3 Rework `register-custom-element.ts`: take the element name verbatim (drop `toKebabCase` derivation and the `if (!name) return` early-return), default shadow to `false`, and assign `options.styles` to `shadowRoot.adoptedStyleSheets` when a shadow root is created.
- [x] 2.4 Add eager validation before `customElements.define` — hyphen/valid-name check and a `customElements.get(name)` collision check, each throwing an actionable error identifying the element (D4).
- [x] 2.5 Strip custom-element knowledge from `component.ts`: remove the `registerCustomElement` import (line 3) and the call (line 118). `component()` now only returns `componentFunction`.
- [x] 2.6 Stop re-exporting `register-custom-element` from `lib/templating/index.ts`, and have `define-element.ts` import the module by path — otherwise the barrel keeps registration alive for every consumer (D1).
- [x] 2.7 Add `"sideEffects": false` to `packages/core/package.json` so bundlers can actually drop `register-custom-element.ts` from apps that never call `defineElement`.
- [x] 2.8 Fix the misleading warning in `setCustomElementProps` (`get-attr-update.ts:272-277`): when `isWebComponent` is falsy the problem is "not a registered custom element", not "must be an object literal" (D6).
- [x] 2.9 Run `test-ci` until green.

## 3. Verify the tree-shaking and hot-path claims

- [x] 3.1 Build `@loom-js/core` and confirm the ES bundle still emits `register-custom-element` only under the `defineElement` export path; check an `apps/loom` build (which imports no `defineElement`) does not include the custom-element class.
- [x] 3.2 Confirm `apps/loom` and `@loom-js/pink` build and render unchanged — neither registers an element today, so this should be a strict no-op for both.

## 4. Documentation

- [x] 4.1 Add a custom-elements section to `packages/core/README.md` (the feature is currently undocumented): `defineElement` vs `component`, the `$`-prefixed prop convention for consumers, light-DOM-vs-shadow choice, and one `adoptedStyleSheets` construction example.
- [x] 4.2 Document the two known limitations from the design — upgrade ordering (D6: import the defining module before rendering a consuming template) and no `observedAttributes`, so attributes are read once at `connectedCallback` and not observed afterward.
- [x] 4.3 State the light-DOM default as a **deliberate phase-1 call, not a permanent stance**: it is the default that works with the styling machinery core has today (none for shadow), whereas the orthodox web-components position — shadow by default, so a consuming page's CSS cannot break the component and the component's CSS cannot leak — is the better fit _once_ real third-party consumption exists and `adoptedStyleSheets` is carrying its weight. Say what would trigger revisiting it, so the default is not mistaken for a rejection of encapsulation.

## 5. Release & conventions

- [x] 5.1 Prettier per `.prettierrc` on all changed files (`--check` clean); let the import-sort plugin handle ordering. — **Blocked by pre-existing tooling breakage:** `prettier-plugin-sort-imports@1.8.11` throws `Cannot read properties of undefined (reading 'Latest')` under `typescript@7.0.2` on _every_ `.ts` file in the repo, including untouched ones (`activity.ts`, `app.ts`). Verified not caused by this change. Formatting validated by running prettier with the plugin bypassed (same core options); import ordering written by hand to the NPM-then-local convention. Plugin/TS incompatibility needs its own fix. **RESOLVED 2026-08-02 by `fix-prettier-import-sorting`:** the plugin gets its own nested `typescript` 6 via the `readPackage` hook in `.pnpmfile.cjs`, prettier runs repo-wide again, and `pnpm format:check` is enforced in CI. (Corrected 2026-08-04: this line previously said the pin was "a scoped override in `pnpm-workspace.yaml`". That was the plan, not the outcome — design D8 of that change established that neither `pnpm.overrides` nor `packageExtensions` can constrain this edge, because pnpm resolves the tool's `typescript` peer from the workspace context before consulting either. The hook is the supported escape hatch and covers four tools, not one.)
- [x] 5.2 `pnpm -F @loom-js/core type-check` **and** `type-check-tests` clean.
- [x] 5.3 Changeset for `@loom-js/core` — **minor**. Call out explicitly that `component()` no longer registers a custom element from `templateFunction.name`, that the path was unreachable for anonymous arrows (i.e. everything), and that `defineElement` replaces it.
- [x] 5.4 Updated `SOLID-AUDIT-REPORT.md` — no entry gained or resolved; refreshed the drifted line refs in the `get-attr-update.ts` 🟡 OCP entry (`specialAttrUpdaters` 288–433 → 300–445, file length 434 → 445). Updated `.claude/skills/skill-config.md` after all: the note here that `define-element.ts` alone would not warrant it was wrong — that file _enumerates_ the `packages/core/src/` public API, so the list went stale. Also recorded why `register-custom-element.ts` is absent from the templating barrel.
- [x] 5.5 Fix the duplicate `4.` list numbering in `proposal.md` ("Confirmed gaps" has two items numbered 4).

## 6. Tracked, not done

- [ ] 6.1 `SimpleComponent` registration and the `ContextFunction[]` return contract — separate change if a use case appears (D5). **Deferred on archive 2026-08-04:** no owner needed. It is gated on a use case that may never arrive, and the exclusion is already stated in the published changeset ("Registration of plain-function (`SimpleComponent`) components is intentionally out of scope"), so consumers learn the boundary from the release notes rather than from this file.
- [x] 6.2 Named slots / `[slot]` distribution for light-DOM elements (D5, design Open Questions). **REHOMED 2026-08-04 to `add-template-component-syntax`** (its proposal's "What Changes"), on archive. It had no owner anywhere else and would have been lost here — it is the multi-region counterpart to that change's children compilation, and both are content-distribution questions about the same authoring syntax. This change's design.md Open Questions stays the prior art.
- [ ] 6.3 `customElements.whenDefined`-aware attribute updating, if the upgrade-ordering constraint bites in practice (D6). **Deferred on archive 2026-08-04:** conditional on a problem that has not appeared, and the trigger is carried in shipped code rather than here — `get-attr-update.ts` warns at runtime when a `$`-prop is set on an unupgraded element and names the fix ("make sure its module is imported before this template renders"). If the constraint bites, that warning is how it surfaces.
- [ ] 6.4 SSR/hydration of custom elements — `add-server-rendering`. **Deferred on archive 2026-08-04:** already owned by the active `add-server-rendering` change, which covers custom elements in its proposal, design, and tasks. Nothing to re-home.
