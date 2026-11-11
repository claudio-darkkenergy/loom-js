# SOLID Audit Report

_Maintained by `.claude/skills/solid-audit/SKILL.md`. Update this file using the audit skill — do not edit violation statuses manually._

**Last full audit:** 2026-05-02
**Last updated:** 2026-11-11

---

## Summary

| Principle | 🔴 Critical | 🟡 Moderate | 🟢 Minor | ✅ Resolved |
| --------- | ----------- | ----------- | -------- | ----------- |
| SRP       | 0           | 1           | 2        | 6           |
| OCP       | 0           | 0           | 3        | 1           |
| LSP       | 0           | 0           | 0        | 1           |
| ISP       | 0           | 0           | 0        | 1           |
| DIP       | 1           | 0           | 0        | 0           |
| **Total** | **1**       | **1**       | **5**    | **9**       |

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

## 🟢 Minor

_Low-risk drift to fix opportunistically._

### `packages/create/scripts/build.mjs`

- **Principle violated:** OCP
- **Severity:** 🟢 Minor
- **Violation:** The packages whose ranges get stamped are hand-kept lists (`LOOM_PACKAGES` and `TOOL_PACKAGES` here, `TEMPLATE_PACKAGES` again in `scripts/check-release-sync.mjs`), so a new registry entry that brings a package (a second UI kit, an `nx` task runner) also means editing one or both scripts.
- **Impact:** The registries promise "a new kit, task runner or formatter is one entry", and they don't keep it; the miss fails loudly (`rangeOf` throws in the matrix tests), but the two lists can drift apart.
- **Recommended fix:** Derive both from create's own `devDependencies`: stamp `^version` for every `workspace:*` entry and the declared range for the rest, and have the release-sync guard read the same `@loom-js/*` names. A new entry then needs only its registry descriptor plus a devDependency. See the OCP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-11-11

---

### `packages/create/src/package-manager.ts`

- **Principle violated:** OCP
- **Severity:** 🟢 Minor
- **Violation:** Each package manager's quirks sit in name checks across four files: `runCommand` here, `pnpm-workspace.yaml` / `.yarnrc.yml` in `scaffold.ts` `repoFiles`, the `workspaces` field skipped for pnpm in `render/package-json.ts`, and yarn's version lookup in `cli.ts`.
- **Impact:** The set of managers is fixed, but their quirks keep growing (pnpm build approvals, yarn's linker); each new one is a change hunted across files instead of a change to one manager's entry.
- **Recommended fix:** A `PackageManager` descriptor per manager (`runCommand`, `repoFiles(context)`, `workspacesField`, `needsVersion`), looked up by the detected name, the same shape as the registries. See the OCP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-11-11

---

### `packages/create/src/cli.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** `run` orchestrates the whole flow, and it also carries the clone reconciliation inline (lines 145–185: clone, conflict check, undo, kept-file and `.gitignore` merge), while the rest of the git step lives in `git.ts`.
- **Impact:** A change to the clone rules edits the orchestrator; it's tested end to end through `flow.test.mjs` but can't be exercised alone.
- **Recommended fix:** Move the block into `git.ts` as `applyClone({ directory, existed, files, spawn, url })`, which returns the adjusted file map or the error to print, so `run` makes one call. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-11-11

---

### `packages/core/src/lib/context/life-cycles.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** The file co-locates DOM mutation observation and unmount teardown (`_lifeCycles.observe`, `forEachRegistrable`, `domChanged`, `teardownContext` at lines 63–280) with lifecycle hook creation, handler registration and dispatch (`resetLifeCycles`, `lifeCycleHooks`, `registerLifeCycleHandler`, `dispatchLifeCycle` at lines 282–350).
- **Impact:** The DOM observation concern and the lifecycle hook factory concern each have distinct reasons to change (e.g., a new browser API for mutation detection, or a new lifecycle event), making the file slightly harder to navigate and modify independently.
- **Recommended fix:** Extract `_lifeCycles.observe`, `forEachRegistrable`, `domChanged` and `teardownContext` into a sibling file (e.g., `mutation-observer.ts`) and import from it. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Status:** 🔲 Open
- **Audited:** 2026-10-03

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

## 📋 File audit log

_Clean file audits of added modules, with the spec covering each._

- **2026-11-11 — `create-loom-cli-utility`, new `packages/create/`:** three 🟢 Minor findings above (`scripts/build.mjs`, `src/package-manager.ts`, `src/cli.ts`); everything else is clean. Its edges come in as `Io` / `Spawn`, so nothing needs a real terminal or process to test. Specs: `cli-core.test.mjs` (`args.ts`, `usage.ts`, `prompts.ts`, `target.ts`, `choices.ts`, `package-manager.ts`, registry-driven help and validation), `scaffold.test.mjs` (`scaffold.ts`, `layers.ts`, `json.ts`, `render/*`, `registry/*`: snapshots, layer rules, layout parity, leakage, formatters), `matrix.test.mjs` (every combination format-checked, type-checked and built; covers `versions.ts` and the built template trees), `flow.test.mjs` (`cli.ts` install and git steps, `git.ts`, `io.ts` `nodeSpawn`), `templates.test.mjs` (`scripts/templates.mjs`, `templates/tailwind/scripts/dev.mjs`), `release-sync.test.mjs` (`scripts/check-release-sync.mjs`).
- **2026-11-09 — `devtools-refinements` logo, new `packages/devtools/src/logo.ts`:** no violations. It holds the loom mark's geometry, shared by the backend's minimized button and checked against the HUD's `LoomLogo` template (`hud.spec.ts`, "shows the loom logo in the toolbar"). Touched files re-audited with no new findings: `backend/{hosts,dock-state}.ts`, `frontend/views/{icons,header}.ts`.
- **2026-11-09 — `devtools-refinements` floating HUD and component-prop links, new `packages/core/src/lib/devtools/instances.ts` and `packages/devtools/src/backend/pointer-drag.ts`:** no violations. `instances.ts` resolves a component value to the live instance it rendered into by walking the owner's slots (`devtools-introspection.spec.ts`, "component values"). `pointer-drag.ts` is the press-move-release tracker the floating window's bar, corner and minimized button share, kept out of `hosts.ts` so hosts stays about layout (`hud.spec.ts` floating specs). Touched files re-audited with no new findings: core `devtools.ts`, `lib/devtools/switch.ts`; devtools `backend/{hosts,dock-state,index,inspect}.ts`, `protocol/types.ts`, `frontend/state.ts`, `frontend/views/{header,hud,details,panes,value-view}.ts`.
- **2026-11-09 — `devtools-refinements` toolbar icons and tagged prop names, new `packages/devtools/src/frontend/views/icons.ts`:** no violations. `icons.ts` holds the toolbar's SVG icons (Pick, dock positions, pop out/dock), a view helper covered by `hud.spec.ts`; `value-view.ts` previews are covered by the new `value-view.spec.ts`. Touched files re-audited with no new findings: `frontend/views/{header,value-view}.ts`.
- **2026-11-06 — `devtools-refinements` side docking, new `packages/devtools/src/backend/{dock-state,fixed-clearance}.ts` and `frontend/views/details.ts`:** no violations. `hosts.ts` keeps the DOM side of docking; the settings, persistence and edge resolution moved to `dock-state.ts` (`dock-state.spec.ts`), and moving fixed elements out of the way is `fixed-clearance.ts`, used by `dock-space.ts` (`dock-space.spec.ts`). `panes.ts` had grown past one concern, so the selected-instance details (path nav, back control, sections) moved to `details.ts` (`hud.spec.ts`). Touched files re-audited with no new findings: `backend/{hosts,dock-space,index}.ts`, `frontend/state.ts`, `frontend/views/{hud,header,panes,activity-item,activity-value,chevron}.ts`, `protocol/types.ts`.
- **2026-11-05 — `devtools-refinements` second review, new `packages/devtools/src/backend/{dock-space,modal-follow,move-into}.ts` and `frontend/views/{chevron,scroll}.ts`:** no violations. `hosts.ts` would otherwise have taken page-space reservation and dialog following, so each is its own module: `dock-space.ts` (spacer and covered scroll-area padding; `dock-space.spec.ts`), `modal-follow.ts` (topmost-modal tracking; `modal-follow.spec.ts`), `move-into.ts` (state-keeping re-parent, shared by hosts and the page layer; `hud.spec.ts` modal case). `chevron.ts` and `scroll.ts` are view helpers (`hud.spec.ts`). Touched files re-audited with no new findings: `backend/{hosts,page-layer,inspect,index}.ts`, `frontend/state.ts`, `frontend/views/{activity-item,activity-value,panes,header,value-view}.ts`, `protocol/types.ts`.
- **2026-11-05 — `devtools-refinements`, new `packages/devtools/src/frontend/views/activity-value.ts`:** no violations. It holds the in-place activity editor (`ActivityValue`, `ValueEditor`, the JSON decode it pre-fills from), split out of `activity-item.ts`, which keeps the item header, scope line and owner link. Spec: `hud.spec.ts` (in-place edit from the inspector and Activities tab, cancel, invalid input). Touched files re-audited with no new findings: `backend/hosts.ts` (dock layout, resize, collapse and storage stay "where the HUD runs"), `backend/page-layer.ts` (clipping and edge markers are drawing; covered by the new `page-layer.spec.ts`), `backend/inspect.ts` (owner map, log snapshot), `backend/index.ts`, `frontend/state.ts`, `frontend/views/{panes,header,value-view}.ts`, `protocol/types.ts`, core `lib/devtools/activity-ref.ts` (`nameActivity`; `devtools-introspection.spec.ts`) and `packages/build/src/devtools-plugin.ts` (`injectActivityLabels`; `build.test.mjs`). Later, core `router.ts` and `lazy-import.ts` (explicit labels only; `devtools-introspection.spec.ts`), with no new findings.
- **2026-10-21 — `loom-devtools`, new `packages/core/src/lib/devtools/` + `src/devtools.ts`:** no violations. One concern per module: `names.ts` (display-name registry), `activity-ref.ts` (activity identity), `hook.ts` (hook slot + pre-backend buffer), `tree.ts` (live-tree reads), `switch.ts` (loader + enable state), `console-api.ts` (console records, exported only through `src/devtools.ts`; the devtools package's `backend/console-api.ts` installs them on the `loom` global). Specs: `component-display-names.spec.ts` (names), `devtools-introspection.spec.ts` (tree, hook, activity-ref), `loom-console-api.spec.ts` (console-api, switch, buffer). Touched files re-audited with no new findings: `activity.ts`, `component.ts`, `define-element.ts`, `app.ts`, `hydrate.ts`, `lib/bootstrap.ts`, `lib/attr-binding.ts`, `types.ts`, `elements/el.ts`, `elements/media.ts`, `elements/route-link.ts`, `lib/templating/compile-component-tags/emit.ts` (display names only). Also clean: `packages/build/src/devtools-plugin.ts` (covered by `packages/build/tests/build.test.mjs`) and the new `packages/devtools/src/` (`protocol/` by `protocol.spec.ts`, `backend/` by `backend.spec.ts`, `frontend/` by `hud.spec.ts`).

---

## ✅ Resolved

_Closed violations. Do not delete these — they are a record of improvements made._

### `packages/core/src/lib/templating/text-updater.ts` → `reconcile-list.ts`, `text-node.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** The file co-locates text-slot application (`applyText`, `textUpdater`, `placeValue` at lines 16–77) with the keyed list reconciler (`handleArrayValue`, `stablePositions`, `isPlacedBefore`, `toFragment`, `isWholeListReplacement` and the live-list store at lines 84–422) — carried over from `get-text-update.ts`, which this file replaces.
- **Impact:** A change to how a text slot writes its value and a change to the list-diffing algorithm are separate reasons to edit the same file, and the reconciler (four fifths of the file) is reachable only through the text updater's module.
- **Recommended fix:** Move the reconciler and its helpers into a sibling file (e.g., `reconcile-list.ts`) that `text-updater.ts` imports. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** The reconciler moved unchanged into `reconcile-list.ts` (`handleArrayValue` exported, its helpers and the live-list store private); `text-updater.ts` keeps `placeValue`, `textUpdater` and `applyText` and imports it. The text-node coercion both files use (`getNewTextValue`) lives in `text-node.ts`.
- **Status:** ✅ Resolved
- **Audited:** 2026-10-03
- **Resolved:** 2026-10-03

---

### `packages/core/src/lib/templating/set-updates-for-paths.ts` → `compile-plan.ts`, `slots.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** `setUpdatesForPaths` both sets up memoized caches for `getDynamicElement` and `getLiveTextNodes` (lines 15–30) and wires the reactive update effects for each path (lines 32–76) — cache initialization and effect wiring are distinct concerns.
- **Impact:** If the memoization strategy changes (e.g., switching from a function-key cache to a WeakMap), the change must happen inside a function that also owns the reactive path-wiring logic, creating unnecessary coupling.
- **Recommended fix:** Minor refactor: lift the two `memo` calls into a `buildNodeCache(paths, liveFragment)` helper and let `setUpdatesForPaths` call it. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** The file no longer exists — `template-instance-plan` removed it: path resolution moved to parse time (`compile-plan.ts` compiles each dynamic node's steps once per template and document) and instance wiring to `slots.ts` (`createSlots` walks the steps, `applySlot` dispatches by kind) — no per-instance memo cache exists any more, so the two concerns live in separate modules.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-10-03

---

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

### `packages/pink/src/components/pink-code-panel/pink-code-panel-content.ts`

- **Principle violated:** SRP
- **Severity:** 🟢 Minor
- **Violation:** `PinkCodePanelContent` both parses the raw code string into lines (`children?.split('\n')`) and renders those lines via `CodeLine` components — two separate transformations in one function.
- **Impact:** A change to the parsing strategy (e.g., preserving trailing whitespace, handling CRLF, adding syntax highlighting tokens) requires editing a rendering function, increasing the chance of unintended UI regressions.
- **Recommended fix:** Extract `splitCodeLines(source: string): string[]` as a pure helper; `PinkCodePanelContent` then calls it and maps the result to `CodeLine`. See the SRP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Landed the recommended fix during the `element-syntax-conversion` pink sweep (task 2.3), which also converted the component to a template: `splitCodeLines(source)` is a pure module-level helper and the render path only maps its result to `CodeLine`. DOM parity with the pre-conversion output proven (whitespace inside `<pre>` compared verbatim).
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-12

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

---

### `packages/core/src/lib/templating/get-attr-update.ts` → `attr-updaters.ts`

- **Principle violated:** OCP
- **Severity:** 🟡 Moderate
- **Violation:** `getSpecialAttrUpdate` (lines 45–113) dispatched to `specialAttrUpdaters` via a `switch(true)` on hard-coded string comparisons (`nodeName === 'attrs'`, `nodeName === 'on'`, `nodeName === 'props'`). The `specialAttrUpdaters` object (lines 300–445) listed every recognized `$`-prefixed attribute. The file had grown to 514 lines by resolution time.
- **Impact:** Adding a new special attribute type (e.g., `$ref`, `$key`, `$bind`) required editing the `switch` block and adding a new entry to `specialAttrUpdaters` — two edits in the update hot path for every dynamic node in the framework.
- **Recommended fix:** Consider converting the switch dispatch to a lookup on `specialAttrUpdaters[nodeName]` with a `default` fallback; new attribute types then extend the map without touching the dispatch logic. See the OCP section in `.claude/skills/solid-principles/SKILL.md`.
- **Resolution:** Landed the dispatch-map fix via `resolve-remaining-audit-items` (tasks 1.1–1.3), adapted to factories because each branch built different bind-time state: named special attributes (`attrs`, `on`, `props`) live in a `specialAttrUpdaterFactories` map whose entries own their state (fresh binding-registry Map, listener collection) and return the update closure; unmapped names fall back to `eventUpdaterFactory` (for `config.events` names — dynamic, so not map keys) then `defaultUpdaterFactory`, preserving the switch's precedence. A new special attribute type is now a single map entry with no dispatch edit; the factory typing also removed the `as BoundSpecialAttrTemplateNodeUpdate` casts. Type-check, type-check-tests, and the full suite (188 tests) green. Since `template-instance-plan` (2026-10-03) the file is `attr-updaters.ts` and the factories are gone: `namedSpecialKinds` in `compile-plan.ts` classifies a special attribute once per template (same precedence) and the `appliers` table in `slots.ts` dispatches by kind to module-level appliers — a new special attribute is one entry in each table and one applier, still with no dispatch edit.
- **Status:** ✅ Resolved
- **Audited:** 2026-05-02
- **Resolved:** 2026-08-12
