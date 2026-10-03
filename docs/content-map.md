# Content map

The docs site is the canonical documentation for `@loom-js/core`. This map is the drift anchor:
per topic, the published outline plus the source and tests the topic describes. A change that
alters consumer-visible behavior in a pointed-to file updates the topics that list it.

It supersedes the README-heading mapping in
`openspec/changes/archive/2026-09-08-align-loom-docs-with-core-readme/content-map.md`. That file
stays the record for everything that is not anchoring: slug immutability, redirects, the
rich-text conventions, the side-nav groups, the cross-link registry.

- **Site:** `https://loom-js-docs.vercel.app/docs/<slug>`
- **Topic sources:** `docs/topics/`, pushed to Contentful with `docs/contentful-sync/`
- **Paths** below are relative to `packages/core/`.
- **Outlines** were read from the live pages on 2026-09-28. Anchors are the kebab-cased heading
  text (h3s indented).

## How to use it

1. A change touches a file under `src/` or alters behavior a listed test pins.
2. Find every topic whose pointers include that file.
3. The change's tasks update those topics (source, draft, publish), or record a follow-up.

Shared internals are listed once under [Shared pointers](#shared-pointers) rather than repeated
per topic.

## Topics

| #   | Slug               | Title            |
| --- | ------------------ | ---------------- |
| 1   | `getting-started`  | Getting Started  |
| 2   | `bootstrapping`    | Bootstrapping    |
| 3   | `configuration`    | Configuration    |
| 4   | `components`       | Components       |
| 5   | `element-syntax`   | Element Syntax   |
| 5a  | `fragments`        | Fragments        |
| 6   | `custom-elements`  | Custom Elements  |
| 7   | `activities`       | Activities       |
| 8   | `routing`          | Routing          |
| 9   | `lazy-imports`     | Lazy Imports     |
| 10  | `server-rendering` | Server Rendering |
| 11  | `hydration`        | Client Hydration |
| 12  | `dehydrated-state` | Dehydrated State |
| 13  | `diagnostics`      | Diagnostics      |
| 14  | `build-tool`       | Build Tool       |

`feedback` is a trailing utility topic with no core source; it is outside this map. `build-tool` is
anchored on `packages/build` and the html-split plugin rather than core — its pointers below are
repo-relative.

### 1. `getting-started`

- **Outline:** Feature highlights · Install · Inclusion · Where next
- **Source:** `package.json` (`name`, `exports`), `src/index.ts`, `src/server.ts` (the export
  surface the highlights name).
- **Also anchors:** `README.md` — the pitch, highlights, install and inclusion lines match this
  topic.

### 2. `bootstrapping`

- **Outline:** The app and `init` · `AppInitProps` · Example
- **Source:** `src/app.ts` (`init`), `src/lib/bootstrap.ts`, `src/lib/mount.ts`, `src/types.ts`
  (`AppInitProps`, `Placement`).
- **Tests:** `tests/unit/app.spec.ts`, `tests/unit/mount-placement.spec.ts`,
  `tests/types/app-init.types.ts`.

### 3. `configuration`

- **Outline:** `AppGlobalConfig` · `appendEvents`
- **Source:** `src/config.ts` (`appendEvents`, the config defaults), `src/types.ts`
  (`AppGlobalConfig`).
- **Tests:** `tests/unit/config.spec.ts`.

### 4. `components`

- **Outline:**
    - Defining a component
    - The template function
    - Life-cycle hooks
    - When a component re-renders
    - Built-in props
        - Refs
    - Attribute and text values
    - Template whitespace
    - Element bindings
        - `$event` · `$attrs` · `$on` · `$props`
    - Functional components
        - Plain functions · Simple components
    - Using components
    - Examples
        - Basic example · Props and interpolation · Accessing the rendered node · Life cycles
- **Source:** `src/component.ts`, `src/simple.ts`, `src/lib/context/` (`life-cycles.ts`,
  `refs.ts`, `owned-values.ts`), `src/lib/attr-binding.ts`,
  `src/lib/templating/get-attr-update.ts`, `src/lib/templating/get-text-update.ts`,
  `src/lib/templating/resolve-value.ts`, `src/lib/templating/collapse-whitespace.ts`, `src/types.ts` (`UtilityProps`, `ReservedProps`,
  `RefContext`, `LifeCycleHandler`, `ContextFunction`).
- **Tests:** `tests/unit/component.spec.ts`, `tests/unit/component/*`,
  `tests/unit/attr-value-semantics.spec.ts`, `tests/unit/collapse-whitespace.spec.ts`, `tests/unit/reactive-attr-bindings.spec.ts`,
  `tests/unit/own.spec.ts`, `tests/unit/context-scopes.spec.ts`,
  `tests/unit/unmount-teardown.spec.ts`, `tests/types/template-tag-values.types.ts`.

### 5. `element-syntax`

- **Outline:**
    - Composing in markup
    - Transform time
    - Markup vs. the functional form
    - Props
        - Spread props · No `$` sigil on component tags · The `key` prop
    - Children
    - Named slots
    - Errors
    - Template comments
    - Element components
        - `RouteLink` · `Svg` · `Picture` · `el(tagName)`
- **Source:** `src/lib/templating/compile-component-tags/*`,
  `src/lib/templating/collapse-whitespace.ts`, `src/lib/templating/table-scope.ts`,
  `src/elements/*`.
- **Tests:** `tests/unit/compile-component-tags/*`, `tests/unit/elements/*`,
  `tests/unit/collapse-whitespace.spec.ts`, `tests/unit/collapse-whitespace-parity.spec.ts`,
  `tests/unit/table-scope.spec.ts`, `tests/unit/table-templates.spec.ts`,
  `tests/unit/array-slot-context-persistence.spec.ts`.

### 5a. `fragments`

- **Outline:** Root forms and inference · Fragments as values · Keyed reconciliation · Named
  regions are fragments
- **Source:** `src/lib/templating/root-form.ts`, `src/lib/templating/update-live-node.ts`,
  `src/lib/templating/compile-component-tags/regions.ts`.
- **Tests:** `tests/unit/template-root-forms.spec.ts`,
  `tests/unit/fragment-array-reconciliation.spec.ts`,
  `tests/unit/compile-component-tags/slot-grouping.spec.ts`,
  `tests/server/region-serialization.test.mjs`.

### 6. `custom-elements`

- **Outline:** `defineElement` · Passing props from a consuming page · Light DOM vs. shadow DOM ·
  Known limitations
- **Source:** `src/define-element.ts`, `src/lib/templating/register-custom-element.ts`,
  `src/types.ts` (`DefineElementOptions`).
- **Tests:** `tests/unit/custom-element.spec.ts`,
  `tests/unit/compile-component-tags/shadow-boundary.spec.ts`.

### 7. `activities`

- **Outline:**
    - The activity
    - Transforms (the async-data path)
    - Transform concurrency
    - The settlement signal
    - Options
    - The returned interface
        - `effect` · `bind` · `reset` · `update` · `value` · `watch`
    - Component-scoped state
    - Examples
        - Attribute binding · Counter
- **Source:** `src/activity.ts`, `src/lib/activity/transform-dispatch.ts`,
  `src/lib/activity/value-store.ts`, `src/lib/reactive.ts`, `src/lib/settlement.ts`,
  `src/lib/attr-binding.ts`, `src/lib/context/owned-values.ts`, `src/types.ts`
  (`ActivityOptions`, `ActivityTransform`, `ActivityEffect`).
- **Tests:** `tests/unit/activity.spec.ts`, `tests/unit/activity-array.spec.ts`,
  `tests/unit/activity-transform-concurrency.spec.ts`, `tests/unit/reactive-unsubscribe.spec.ts`,
  `tests/unit/reactive-attr-bindings.spec.ts`, `tests/unit/own.spec.ts`,
  `tests/unit/settled.spec.ts`, `tests/types/activity-transform.types.ts`.

### 8. `routing`

- **Outline:**
    - The two-layer pipeline
    - API
        - `createRoutes` · `route` · `routeEffect` / `watchRoute` · `locationEffect` /
          `watchLocation` · `redirect` · `RouteLink` · `routeProps`
    - Route guard
    - Hash and anchor navigation
    - Layer 1 on its own
    - Example
- **Source:** `src/router.ts`, `src/lib/route-assets.ts`, `src/elements/route-link.ts`,
  `src/types.ts` (`RouteValue`, `OnRouteOptions`, `SyntheticRouteEvent`).
- **Tests:** `tests/unit/route-activation.spec.ts`, `tests/unit/route-guard.spec.ts`,
  `tests/unit/route-search-params.spec.ts`, `tests/unit/route-search-params-unmatched.spec.ts`,
  `tests/unit/route-asset-preload.spec.ts`, `tests/unit/location.spec.ts`,
  `tests/unit/hash-navigation.spec.ts`, `tests/unit/hash-navigation-routed.spec.ts`,
  `tests/unit/elements/route-link.spec.ts`, `tests/server/route-rendering.test.mjs`.

### 9. `lazy-imports`

- **Outline:** `lazyImport` · `lazyContent`
- **Source:** `src/lazy-import.ts`.
- **Tests:** `tests/unit/lazy-import.spec.ts`, `tests/types/lazy-import.types.ts`.

### 10. `server-rendering`

- **Outline:** Rendering off-browser · `renderToString` · `renderToStringSync` · Choosing a DOM
  implementation · Semantics worth knowing · Prerendering (SSG)
- **Source:** `src/server.ts`, `src/lib/dom.ts`, `src/lib/settlement.ts`.
- **Tests:** `tests/server/render-to-string.test.mjs`,
  `tests/server/render-to-string.jsdom.test.mjs`,
  `tests/server/render-to-string.happy-dom.test.mjs`,
  `tests/server/mixed-implementations.test.mjs`, `tests/server/settle-policy.test.mjs`,
  `tests/server/ssg-smoke.test.mjs`, `tests/server/route-rendering.test.mjs`,
  `tests/server/table-templates.test.mjs`, `tests/server/whitespace-collapse.test.mjs`.

### 11. `hydration`

- **Outline:** Settle-and-swap · `hydrate` · `settled` · The swap · Semantics worth knowing
- **Source:** `src/hydrate.ts`, `src/settled.ts`, `src/lib/settlement.ts`,
  `src/lib/event-replay.ts`, `src/lib/hydrating-roots.ts`, `src/types.ts` (`AppHydrateProps`).
- **Tests:** `tests/unit/hydrate.spec.ts`, `tests/unit/hydrate-e2e.spec.ts`,
  `tests/unit/hydrate-event-replay.spec.ts`, `tests/unit/settled.spec.ts`.

### 12. `dehydrated-state`

- **Outline:**
    - Paying for data once
    - API
        - `resource` · `primeResources` · `dehydrate` · `serializeState` · Boot contract
    - Example
    - Semantics worth knowing
- **Source:** `src/resource.ts`, `src/dehydrate.ts`, `src/boot-contract.ts`,
  `src/lib/resource-cache.ts`, `src/types.ts` (`SerializedStateEnvelope`).
- **Tests:** `tests/unit/resource.spec.ts`, `tests/unit/dehydrated-state-e2e.spec.ts`,
  `tests/server/dehydrate.test.mjs`, `tests/server/boot-contract.test.mjs`.

### 13. `diagnostics`

- **Outline:** Two lanes · The line anatomy · Naming subjects with label · `setDebug` and scopes ·
  Semantics worth knowing
- **Source:** `src/config.ts` (`setDebug`), `src/lib/globals/loom-console.ts`,
  `src/lib/globals/diagnostic-format.ts`.
- **Tests:** `tests/unit/set-debug.spec.ts`, `tests/unit/diagnostic-format.spec.ts`,
  `tests/unit/diagnostic-logging.spec.ts`.

## Code block directives

A paragraph whose whole content carries the code mark is a code block. Its leading comment lines
are directives, stripped by the renderer (`apps/loom/src/app/components/content/styled-rich-text/lib/code.ts`).

| Line | Directive                   | Effect                                        |
| ---- | --------------------------- | --------------------------------------------- |
| 1    | `// @lang <lang>`           | Panel header label and highlighting language. |
| 2    | `// @tab <label> [<group>]` | The block is one variant of a tabbed panel.   |

- **Grammar.** `@tab` is only read on the line after `@lang`. `<label>` and `<group>` are single
  words.
- **Consecutive-run rule.** Two or more top-level tab blocks in a row render as one panel, one tab
  per block, the first tab selected. Any other block between them ends the run. A tab block on its
  own renders as a plain panel.
- **Group sync.** Panels whose first tab names the same `<group>` share one selection across the
  app: picking `pnpm` in one switches every `pm` panel. A panel without that label shows its first
  tab. Panels with no group switch on their own.
- **Languages.** Tabs in one panel may differ in `@lang`; the header shows the selected tab's.
- **Topic sources.** Write the fence info as ` ```bash tab=npm group=pm `; `md2rich.py` emits both
  directive lines.
- **Markdown output.** `llms.txt` serializes each variant as its own fenced block.

### 14. `build-tool`

- **Outline:**
    - The blessed build
    - Quick start
    - Commands
    - Config
        - Routes and shells · HTML · Defines, copies, server · The `esbuild` escape hatch
    - Prerendering
    - TypeScript
    - Programmatic use
    - Raw esbuild and other bundlers
- **Source (repo-relative):** `packages/build/src/config.ts` (the option surface and hook
  types), `src/cli.ts`, `src/resolve-config.ts` (`resolveMode`, defaults), `src/esbuild-options.ts`
  (layout names, mode defaults, escape hatch), `src/template.ts` (default shell),
  `src/prerender.ts` (pipeline, `shellRouteOf`, `ROOT_SHELL_FILE`), `src/load-config.ts`;
  `packages/esbuild-plugin-html-split/src/types.ts`, `src/route-css.ts` (`routeScopeOf`);
  `packages/core/src/boot-contract.ts`. `apps/loom/loom.config.ts` is the reference consumer.
- **Tests:** `packages/build/tests/build.test.mjs`.

## Shared pointers

Internals that several topics depend on. A consumer-visible change here is checked against every
topic named.

| Source                                                          | Topics                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/types.ts`                                                  | every topic, by the types listed in its entry                 |
| `src/index.ts`, `src/server.ts` (export lists)                  | `getting-started`, plus the topic that owns the export        |
| `src/lib/settlement.ts`                                         | `activities`, `lazy-imports`, `server-rendering`, `hydration` |
| `src/lib/templating/index.ts`, `src/html-parser.ts`             | `components`, `element-syntax`, `fragments`                   |
| `src/lib/templating/set-reactive-updates.ts`, `src/lib/memo.ts` | `components`, `activities`                                    |

## Export coverage

Every export of `src/index.ts` and `src/server.ts` has a topic above or is excluded here.

| Export                                                                                              | Topic              |
| --------------------------------------------------------------------------------------------------- | ------------------ |
| `init`                                                                                              | `bootstrapping`    |
| `appendEvents`                                                                                      | `configuration`    |
| `setDebug`                                                                                          | `diagnostics`      |
| `component`, `simple`                                                                               | `components`       |
| `el`, `Svg`, `Picture`, `RouteLink`                                                                 | `element-syntax`   |
| `defineElement`                                                                                     | `custom-elements`  |
| `activity`                                                                                          | `activities`       |
| `createRoutes`, `route`, `routeEffect`, `watchRoute`, `locationEffect`, `watchLocation`, `redirect` | `routing`          |
| `lazyImport`, `lazyContent`                                                                         | `lazy-imports`     |
| `renderToString`, `renderToStringSync`                                                              | `server-rendering` |
| `hydrate`, `settled`                                                                                | `hydration`        |
| `resource`, `primeResources`, `dehydrate`, `serializeState`                                         | `dehydrated-state` |

**Excluded on record** (reasons carried from the `scrub-core-readme` audit):

- `canDebug`, `debugIsOn` — internal gates; `setDebug` and `globalConfig.debug` are the API.
- `config` — internal config object; direct mutation is unsupported.
- `setToken` — `globalConfig.token` at boot is the supported path.
- `isAttrBinding`, `AttrBinding` — the brand check behind `bind`; consumers use `bind`.

Exported types are documented inside the topic that owns their function; none has a topic of
its own.
