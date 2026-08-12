# SOLID Audit Report

_Maintained by `.claude/skills/solid-audit/SKILL.md`. Update this file using the audit skill — do not edit violation statuses manually._

**Last full audit:** 2026-05-02
**Last updated:** 2026-08-11

---

## Summary

| Principle | 🔴 Critical | 🟡 Moderate | 🟢 Minor | ✅ Resolved |
| --------- | ----------- | ----------- | -------- | ----------- |
| SRP       | 0           | 1           | 3        | 3           |
| OCP       | 0           | 1           | 1        | 0           |
| LSP       | 0           | 0           | 0        | 1           |
| ISP       | 0           | 0           | 0        | 1           |
| DIP       | 1           | 1           | 0        | 0           |
| **Total** | **1**       | **3**       | **4**    | **5**       |

---

## 🔴 Critical

_Violations that must be resolved before adding new code to the affected file._

### `services/api/log.ts`

- **Principle violated:** DIP
- **Severity:** 🔴 Critical
- **Violation:** `s3Client` is instantiated as a module-level constant at lines 15–20; the `S3Client`, bucket name, bucket prefix, and region are all resolved at import time with no injection point.
- **Impact:** Any unit test of `POST` must either open a real AWS connection or mock `@aws-sdk/client-s3` internals — coupling tests to SDK implementation details rather than an interface boundary.
- **Recommended fix:** Extract a `LogStore` interface to `services/utils/log-store.ts` and an `S3LogStore` implementation to `services/utils/s3-log-store.ts`. Accept a `LogStore` as a defaulted parameter on `POST` (see the DIP section in `.claude/skills/solid-principles/SKILL.md` for the full code example).
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

## 🟡 Moderate

_Violations to resolve the next time the affected file is touched._

### `services/api/log.ts`

- **Principle violated:** SRP
- **Severity:** 🟡 Moderate
- **Violation:** The `POST` function performs at least five distinct operations: parse the request body, generate a timestamp, construct the S3 object key, read the existing log file, append the new entry, write the updated file back, and format the HTTP response.
- **Impact:** Any change to the log-entry schema, the S3 key naming strategy, or the HTTP response shape requires editing this single function, increasing the chance of regressions across unrelated concerns.
- **Recommended fix:** Extract three helpers — `buildLogEntry(body)`, `buildLogKey(prefix, date)`, and `appendToStore(store, key, entry)` — so that `POST` becomes a thin orchestrator. Apply after resolving the DIP Critical violation above (SRP section, `.claude/skills/solid-principles/SKILL.md`).
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

### `packages/core/src/lib/templating/get-attr-update.ts`

- **Principle violated:** OCP
- **Severity:** 🟡 Moderate
- **Violation:** `getSpecialAttrUpdate` (lines 45–113) dispatches to `specialAttrUpdaters` via a `switch(true)` on hard-coded string comparisons (`nodeName === 'attrs'`, `nodeName === 'on'`, `nodeName === 'props'`). The `specialAttrUpdaters` object (lines 300–445) lists every recognized `$`-prefixed attribute.
- **Impact:** Adding a new special attribute type (e.g., `$ref`, `$key`, `$bind`) requires editing the `switch` block and adding a new entry to `specialAttrUpdaters` — two edits in a 445-line file that is the update hot path for every dynamic node in the framework.
- **Recommended fix:** Consider converting the switch dispatch to a lookup on `specialAttrUpdaters[nodeName]` with a `default` fallback; new attribute types then extend the map without touching the dispatch logic. See the OCP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

## 🟢 Minor

_Low-risk drift to fix opportunistically._

### `packages/core/src/lib/context/life-cycles.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** The file co-locates DOM mutation observation setup (`_lifeCycles.observe`, `domChanged`, and the `MutationObserver` callback at lines 52–180) with lifecycle hook creation and state management (`lifeCycles`, `createLifeCycleHook`, `lifeCycleStateUpdateEffect` at lines 195–270).
- **Impact:** The DOM observation concern and the lifecycle hook factory concern each have distinct reasons to change (e.g., a new browser API for mutation detection, or a new lifecycle event), making the file slightly harder to navigate and modify independently.
- **Recommended fix:** Extract `_lifeCycles.observe` and `domChanged` into a sibling file (e.g., `mutation-observer.ts`) and import from it. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

### `packages/pink/src/components/pink-code-panel/pink-code-panel-content.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** `PinkCodePanelContent` both parses the raw code string into lines (`children?.split('\n')`) and renders those lines via `CodeLine` components — two separate transformations in one function.
- **Impact:** A change to the parsing strategy (e.g., preserving trailing whitespace, handling CRLF, adding syntax highlighting tokens) requires editing a rendering function, increasing the chance of unintended UI regressions.
- **Recommended fix:** Extract `splitCodeLines(source: string): string[]` as a pure helper; `PinkCodePanelContent` then calls it and maps the result to `CodeLine`. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

### `packages/core/src/lib/templating/set-updates-for-paths.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** `setUpdatesForPaths` both sets up memoized caches for `getDynamicElement` and `getLiveTextNodes` (lines 15–30) and wires the reactive update effects for each path (lines 32–76) — cache initialization and effect wiring are distinct concerns.
- **Impact:** If the memoization strategy changes (e.g., switching from a function-key cache to a WeakMap), the change must happen inside a function that also owns the reactive path-wiring logic, creating unnecessary coupling.
- **Recommended fix:** Minor refactor: lift the two `memo` calls into a `buildNodeCache(paths, liveFragment)` helper and let `setUpdatesForPaths` call it. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

### `packages/core/src/config.ts`

- **Principle violated:** OCP
- **Severity:** 🟢 Minor
- **Violation:** The `defaultEvents` array (lines 19–91) is a hard-coded list of 64 DOM event names. To support a custom event type (e.g., a custom element's dispatched event), a consumer must call `appendEvents()` at app bootstrap — there is no way to provide a replacement or subset without modifying the default list.
- **Impact:** Low; `appendEvents()` is a documented extension point. The risk is that the `defaultEvents` array grows unboundedly as new events are added via copy-paste rather than being driven by actual usage.
- **Recommended fix:** Low priority. Could introduce a `setEvents(events: string[])` API that replaces the list entirely (vs. `appendEvents` which only extends), enabling tighter tree-shaking. See the OCP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-05-02

---

## ✅ Resolved

_Closed violations. Do not delete these — they are a record of improvements made._

### `packages/core/src/lib/templating/compile-component-tags.ts` → `compile-component-tags/`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** The module co-located the grammar scanner (`scanAttrs`, `scanText`) with the plan emitter (`makeComponentGetter`, `makeChildrenComponent`) — parsing the accepted grammar and constructing the render-time getters are two separable concerns in one file. The `add-named-slots` change grew the file further (plain-tag walker, depth tracking), triggering the entry's revisit condition.
- **Resolution:** Split into a folder module, one concern per file: `grammar.ts` (token classes, name reader, throw path), `regions.ts` (statics/getters assembly primitives), `emit.ts` (synthesized components + component getter), `scanner.ts` (the cooperating scan state machine), `types.ts` (transform-internal shapes), `index.ts` (public contract: bail-out + plan finalization). The public import path is unchanged (the folder's `index.ts` resolves under the package's CJS-mode NodeNext resolution), and the test suite was mirrored into `tests/unit/compile-component-tags/` with one spec file per concern. Bundle cost of the split: +13 B min+gzip (rollup flattens the folder).
- **Status:** ✅ Resolved
- **Audited:** 2026-08-07 (resolved 2026-08-07, `add-named-slots` task 5.3)

---

### `packages/pink/src/elements/pink-button/pink-button.ts`

- **Principle violated:** LSP
- **Severity:** 🟡 Moderate
- **Violation:** `PinkButton` silently renders as `<a>` (via `Link`) when `href` is present and as `<button>` (via `Button`) otherwise — the root element type is not part of the `PinkButtonProps` contract, so callers cannot predict it.
- **Impact:** Code that queries for `button` elements, tests for button-specific attributes (`type`, `disabled`), or passes `PinkButton` anywhere a predictable `<button>` wrapper is expected will break or produce incorrect output when `href` is added, without any TypeScript warning.
- **Recommended fix:** Expose the element choice explicitly: rename to `PinkLinkButton` when an `href` is required, or add an `as: 'button' | 'link'` prop that makes the contract visible. Alternatively, document the switching behavior in `PinkButtonProps` so callers opt in consciously. See the LSP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Took the document-the-contract option during the `element-syntax-conversion` tags retirement (task 2.1): `PinkButtonProps.href` now carries the root-element contract in its doc comment — `href` set → `<a>` root (with `target`), unset → `<button>` root (with `type`/`disabled`/`title`/`aria`) — and each root-specific prop is annotated with the root it applies to. The props are now locally defined (no tags `ButtonProps` inheritance), so the annotated surface is the whole contract; the root switch itself is DOM-parity-proven against the pre-conversion output.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-11

---

### `packages/pink/src/types/index.ts`

- **Principle violated:** ISP
- **Severity:** 🟢 Minor
- **Violation:** `PinkDynamicProps` declares `is?: Component | any` — the `any` in the union defeats type checking on the `is` prop — and an index signature `[key: string | symbol]: unknown` that forces every consumer to accept an effectively unbounded set of unknown keys.
- **Impact:** TypeScript cannot catch type mismatches on the `is` prop or on any property passed through `PinkDynamicProps`. Consumers that need only `is` are still forced to accept all unknown keys, making it impossible to detect extraneous prop passing at the type level.
- **Recommended fix:** Narrow `is` to `Component` (drop the `| any`); consider removing the index signature and replacing it with explicit opt-in `attrs?: AttrsTemplateTagValue` for pass-through needs. See the ISP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Landed the recommended fix in the `element-syntax-conversion` pilot (task 1.2, pulled forward from the 2.5 plan): `is` is now typed `Component` and the index signature is gone — arbitrary passthrough goes through the standard `attrs`/`on` props. Ripple typing fixes landed in `pink-tag`, `pink-interactive-tag`, and its story; whole-app DOM parity held.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-11

---

### `apps/loom/src/app/pages/docs/layout.ts`

- **Principle violated:** SRP
- **Severity:** 🟡 Moderate
- **Violation:** `DocsLayout` (a `SimpleComponent`) both orchestrates data for the page — calling `useSelectedPage('/docs')`, `useSideNav(...)`, `useDefaultTopicRedirect(...)`, and `watchRoute(...)` — and renders the full page structure including nested activity effects.
- **Impact:** Changes to the data-fetch strategy (e.g., swapping Contentful for another source), the breakpoint logic, or the redirect rule all require editing the layout component, blurring the line between data orchestration and rendering.
- **Recommended fix:** Extract a `useDocsLayout()` hook that encapsulates the four setup calls and returns derived state; `DocsLayout` then only calls the hook and renders. This mirrors the established pattern in `apps/loom/src/app/logic/hooks/`. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Landed the recommended fix via `fix-per-render-hook-leaks` (task 3.1/3.2): the four setup calls moved into a new run-once `useDocsLayout()` hook in `apps/loom/src/app/logic/hooks/use-docs-layout.ts`, with the redirect and topic watchers scoped to the docs route (`RoutePath.Docs`); `DocsLayout` now calls the hook and renders. The extraction also fixes the per-mount listener/watcher leaks that motivated the change.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-11

---

### `packages/core/src/router.ts`

- **Principle violated:** SRP
- **Severity:** 🟡 Moderate
- **Violation:** The `Router` class (294 lines) is responsible for at least four distinct concerns: matching a `Location` to a route config entry (`transform` + `validateRoute`), extracting dynamic URL parameters (`parseParams`), coordinating lazy-loaded page imports (`pageRouteEffect`), and managing History API updates (`route`, `redirect`, `watchRoute`).
- **Impact:** A change to URL parameter syntax, a new validation rule, or a swap of the lazy-import strategy all require editing the same class, increasing cognitive load and the risk of breaking unrelated routing behavior.
- **Recommended fix:** The internal `Router` class is not exported; refactoring its private methods into separate, focused helpers (e.g., `matchRoute`, `extractParams`, `validateRoute`) within the same file would lower complexity without changing the public API. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Landed the recommended fix via `fix-router-activation-policy` (which also generalized the activation-policy guard): `matchRoute` and `extractParams` extracted as pure module-level helpers beside the class — `extractParams` returns its params object instead of mutating `this.params` — with `transform` reduced to an orchestrator; `validateRoute` stays a private method as it needs `redirect`/`routesConfig`. Public API unchanged; full suite plus new `route-activation` specs green; +32 B min+gzip combined with the guard fix.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-11
