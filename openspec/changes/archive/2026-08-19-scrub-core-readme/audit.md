# Audit — scrub-core-readme

Checked against `packages/core/src/index.ts` and `src/server.ts` on branch `edge-2026`.

## 1. Export checklist (values)

### `@loom-js/core` (src/index.ts)

| Export                                                                                              | Source               | README status                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `activity`                                                                                          | activity.ts:19       | documented — **drifted** (signature, returns, no transforms)                                                                        |
| `init`                                                                                              | app.ts:7             | documented — **incomplete** (`append`, `globalConfig`, `root` default)                                                              |
| `component`                                                                                         | component.ts:11      | documented — **drifted** (claims two lifecycle hooks)                                                                               |
| `appendEvents`                                                                                      | config.ts:108        | undocumented — **include** (public-intent: consumers add custom event names)                                                        |
| `canDebug`                                                                                          | config.ts:113        | undocumented — **exclude** (internal gate read by `loomConsole`)                                                                    |
| `config`                                                                                            | config.ts:119        | undocumented — **exclude** (internal config object; direct mutation unsupported)                                                    |
| `debugIsOn`                                                                                         | config.ts:125        | undocumented — **exclude** (internal gate; `setDebug` is the API)                                                                   |
| `setDebug`                                                                                          | config.ts:128        | documented (Diagnostics)                                                                                                            |
| `setToken`                                                                                          | config.ts:139        | undocumented — **exclude** (`globalConfig.token` at boot is the supported path)                                                     |
| `defineElement`                                                                                     | define-element.ts:34 | documented                                                                                                                          |
| `el`, `RouteLink`, `Svg`, `Picture`                                                                 | elements/            | documented (Element components)                                                                                                     |
| `hydrate`                                                                                           | hydrate.ts:22        | documented                                                                                                                          |
| `lazyImport`                                                                                        | lazy-import.ts:12    | undocumented — **include** (referenced by SSR/hydration sections with no definition)                                                |
| `importLazy`                                                                                        | lazy-import.ts:41    | undocumented — **include briefly** (typed `ContextFunction` convenience over `lazyImport`; source carries a `@TODO` questioning it) |
| `primeResources`, `resource`                                                                        | resource.ts          | documented (Dehydrated state)                                                                                                       |
| `createRoutes`, `locationEffect`, `routeEffect`, `redirect`, `route`, `watchLocation`, `watchRoute` | router.ts            | documented (Routing)                                                                                                                |
| `sanitizeLocation`                                                                                  | router.ts:502        | undocumented — **exclude** (source marks the export DEPRECATED, removal planned)                                                    |
| `settled`                                                                                           | settled.ts:14        | documented (Client hydration)                                                                                                       |
| `simple`                                                                                            | simple.ts:16         | undocumented — **include** (public counterpart to `component()`; `Picture` is built on it)                                          |

### `@loom-js/core/server` (src/server.ts)

`renderToString`, `renderToStringSync`, `RenderToStringOptions`, and (via `./dehydrate`) `dehydrate`, `serializeState`, `DehydratedState` — all documented (SSR & Dehydrated state sections). No drift found.

### Types

Type exports are documented through their owning sections (e.g. `AppInitProps` under Bootstrapping, `ActivityTransform` under Activities, `SourceProps` under Element components), not as a standalone reference — that stays the policy. `Aria` is `@deprecated` in source and stays undocumented.

## 2. Drift list (README line → source)

1. README:50 — `AppInitProps` shown as `{ app: (ctx?) => Node; onAppMounted?: (mountedApp: Node) => any; root: HTMLElement }`; actual is `{ app: ContextFunction; append?: boolean | null; globalConfig?: AppGlobalConfig; onAppMounted?: (mountedApp: Element) => void; root?: Element | null }` (types.ts:10–16) with `root` defaulting to `document.body` (app.ts:12).
2. README:63–70 — `init` Quick Example: missing comma after the `onAppMounted` callback.
3. README:101 — "two life-cycle methods: `onCreated(handler)` & `onRendered(handler)`"; actual five hooks (types.ts:274–280): `onBeforeRender`, `onCreated`, `onMounted`, `onRendered`, `onUnmounted`.
4. README:311 — `activity<T>(initialValue)`; actual `activity<V, I = V>(initialValue, transformOrOptions?, options?)` (activity.ts:19–23).
5. README:317 — "initialValue - any type of value which is unchanged throughout the life of the activity" — describes the frozen `initialValue` _property_ (activity.ts:87), not the argument.
6. README:319 — Returns shape lists `{ effect; update; value }`; actual seven members: `bind`, `effect`, `initialValue`, `reset`, `update`, `value`, `watch` (activity.ts:93–208).
7. README:331 — typo "introducted".
8. README:337 — `update(newValue)`; actual `update(valueInput: I, forceUpdate = force)` (activity.ts:176) routing through the transform when one is set, with async transform promises tracked for `settled()` (activity.ts:179–187).
9. README:340 — `value()` "always returns the current value"; actually returns a **shallow copy** for plain objects/arrays (activity.ts:42–47, 82–84).
10. Transforms and `ActivityOptions` (`deep`, `force`; types.ts:322–332) documented nowhere, while SSR/hydration/dehydration sections all lean on "async activity transforms".
11. README:645–661 — App Initialization example: `PrerenderSsgWebpackPlugin` is retired tooling; also a "syncronous" typo.
12. README:25 — `npm i @loom-js/core -S` (obsolete flag).
13. README:683 — imports `MouseEventListener` from `@loom-js/core`; no such export exists (never in index.ts). Use the DOM `EventListener` type instead.
14. README:726 — `/ => true` malformed comment in the `node()` example.
15. README:736–739 — Life Cycles example uses `/` line comments (invalid syntax) and repeats the "two life-cycle methods" claim.
16. README:772 — Activity example: `${ label }` spacing, and `<span>` where `</span>` is needed.
17. README:776–795 — Activity example: `component(html => {` never closes the arrow body — missing `}` before `)`.
18. README:11 — "Weakmap" → `WeakMap`.

Non-README finding (not fixed here per design non-goal): `createRoutes`'s options type declares `guard?: (routeValue: RouteValue) => boolean` (router.ts:431) but the implementation never reads it. Left undocumented; candidate for its own change.

## 3. Deliberate exclusions (with reasons)

- `canDebug`, `debugIsOn` — internal gates the framework's `loomConsole` reads; the public control is `setDebug` / `globalConfig.debug`.
- `config` — the live internal config object; supported mutation paths are `globalConfig` at boot, `setDebug`, and `appendEvents`.
- `setToken` — the render-token escape hatch; `globalConfig.token` at boot is the documented path, and mid-run token swaps are untested territory.
- `sanitizeLocation` — source JSDoc marks the export DEPRECATED with planned removal.
- `Aria` type — `@deprecated` in favor of `ReservedProps['attrs']`.
- `createRoutes`' `guard` option — declared but not implemented (see drift list).
