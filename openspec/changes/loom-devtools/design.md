# Design

## Context

See proposal.md — Why. The current state that shapes the approach:

- Every rendered component already has a live context object forming a tree: `parent`, `ctxScopes` (template function → child context), `children` / `arrayChildren`, `props` (as last rendered), `root` (its DOM node or nodes), `fingerPrint` (the template function), `lifeCycleState`, `owned`, `slots` (`types.ts` `ComponentContext`). Nothing keeps a reference to the top of that tree after `init` / `hydrate` return, and nothing maps a DOM node back to its context.
- Component identity is the template function, which is anonymous in practice (`export const ContentCard = component<…>((html, props) => …)`). The name exists only in the binding, so neither `Function.name` nor core can recover it — and core must not rely on `Function.name` anyway (`context-function-identity`).
- An activity's subscribers live in a closure-private `scopedActions` map keyed by context; `bind()` bindings and `watch()` subscriptions leave no trace on any context.
- `bootstrap()` already installs a `loom` global (`LoomGlobal`, currently `{ setDebug }`) in every build; diagnostics name activities by `label` or a generated tag (`createDiagnosticSubject`).
- Core already ships a second rollup entry (`./server`) sharing chunks with `.`, so a third entry shares module instances with the main one for free.
- `@loom-js/build` derives `__DEV__` from mode and wraps esbuild; the app's code and `@loom-js/pink` (which ships TS source) pass through its plugin pipeline.
- TypeScript 7 has no JS compiler API and esbuild exposes no AST, so build-time transforms must work without a parser.

## Goals / Non-Goals

**Goals:**

- Zero cost when switched off beyond a null check per hook site and a property write per effect boundary/binding; prove it with `pnpm bench`.
- Production-capable: a `'lazy'` build carries no devtools bytes until `loom.devtools.enable()` runs.
- One protocol for every frontend placement, so a browser extension can be added later as a relay without changing the backend.
- The HUD never appears in, styles, or perturbs the app it inspects.

**Non-Goals:**

- Editing props. A parent's next render overwrites them; activities are the editable state.
- Time-travel / state history, component source "open in editor", and source locations in any build. (Names only.)
- A browser extension. The protocol keeps the door open; nothing here builds one.
- Inspecting server renders (`renderToString`). The registry is client-only.

## Decisions

### D1 — Pull for structure, push only for activity

The tree, props and element lookup are computed on demand by walking live contexts from the root registry. Push events flow through a single module-level `devtoolsHook` that is `null` until a backend installs it, with two sites: `rendered(ctx, ms)` (component renders and effect-boundary re-runs — structural changes always arrive through one of these, so no separate mount/unmount hook is needed) and `activityCreated(activity)`. Each hot-path site is `hook && hook.rendered(ctx, …)`. Activity commits need no core hook: the backend `watch()`es the activities it discovers. Timing (`performance.now()` pairs) is taken only when the hook is set.

_Alternative:_ React-style always-on bookkeeping (fiber-like tree mirror maintained per render). Rejected — it puts per-render cost on every user to serve the few who inspect.

Consequence: enabling devtools mid-session yields a complete tree immediately; only render timings that happened before the hook was installed are lost. `enable({ persist: true })` (sessionStorage flag, read in `bootstrap`) starts the loader before `init` so reload-to-capture-boot works.

### D2 — Split: primitives in core, presentation in `@loom-js/devtools`

Core owns what needs internals and must be version-locked to them: root registry, walk, element lookup, activity back-refs, the hook, names, the loader registration, the `loom.devtools` switch, and the console-API records (`@loom-js/core/devtools` subpath). `@loom-js/devtools` owns everything visual and installs the console API (`loom.tree/inspect/activities`) on the global while it runs: backend message handling, value encoding, highlight/picker layer, HUD, console formatters, perf tracks.

_Why not all in core:_ the HUD is built with pink, and pink peer-depends on core — a cycle. _Why not all in devtools:_ the walk needs private context fields. _Why the console API waits for devtools:_ every end user would pay for it otherwise (about 600 B gz of core's 1,229 B), and without the package's build wiring a production tree is mostly unnamed. Lazy-loading it from core instead was measured as a net loss: the shared chunk esbuild splits off outweighs the 484 B deferred.

Core's main entry is budgeted: the added bytes (registries, hook, switch) stay ≤ 1 KB min+gzip, measured in tasks.

### D3 — Element lookup by walk, not by node map

`loom.inspect(el)` walks from the roots to the deepest context whose `root` (or any node of a root array) contains `el`. O(tree) per query, which is fine at console/picker cadence. _Alternative:_ a `WeakMap<Node, ctx>` written on every root creation — rejected, it's a hot-path write for a cold-path read.

### D4 — Activities: back-refs plus hook-time registry

Each activity effect boundary context records its activity handle (`ctx.activity`), and each `AttrBinding` carries its handle — so the walk finds every activity that drives the DOM. Activities used only through `watch()` or not yet rendered are reported through `hook.activityCreated` when the hook is installed at creation time (persisted enable). Display identity reuses the diagnostic subject (`⟨label⟩` / `activity#N`).

### D5 — Names: options bag + module-tail injection

`component(fn, { name })` writes a `WeakMap<TemplateFunction, { name }>`; the registry is read through the context's `fingerPrint`. `defineElement` passes no name option (its `name` parameter is the tag); its components display as `Name <tag>` when a name is known, `<tag>` otherwise. `simple()` produces no context and stays invisible in the tree.

Injection without a parser: the build plugin scans each loaded module for column-0 declarations `(export )?(const|let) Ident (: Type)? = (component|defineElement)(<…>)?(` and appends, at module end, one `__loomName(Ident, 'Ident')` call per match plus a single import of the setter from `@loom-js/core/devtools`. Appending avoids locating the call's closing paren across template literals. The setter is a no-op when an explicit name exists (explicit wins). Indented (non-top-level) declarations are skipped by design. Names are set after module evaluation and before `init`, since rendering never happens at import time in a loom app.

_Alternative:_ rewrite the call to add `{ name }`. Rejected — needs balanced-paren scanning through template literals, generics and nested calls.

Injection runs in development, and in production only when `devtools: 'lazy'`.

### D6 — Both placements run the HUD in its own document

The dock (fixed iframe at the page edge) and the popup (`window.open`) both host the same prebuilt frontend; neither shares the app's core instance. Reasons: core resolves DOM constructors through `getWindow()` and `instanceof`-checks nodes, so one core instance cannot drive a second window's DOM; an iframe isolates CSS in both directions and keeps HUD contexts out of the app's tree with no self-exclusion logic.

The frontend is prebuilt by `@loom-js/devtools`'s own build into one self-contained JS+CSS string (its own bundled core + pink CSS) and injected via `srcdoc` (dock) or `document.write` (popup). This is bundler-agnostic — no asset URLs to resolve in the consumer's build. The backend is the only part bundled with the app.

_Alternative:_ shadow-root overlay on the app's core instance with an in-memory transport. Rejected — needs self-exclusion in the walk and hook, adopted pink styles, and still needs a second model for the popup.

### D7 — Highlight and picker are drawn by the backend

The frontend can't touch the app's DOM, so the backend owns a fixed-position layer (plain DOM in a closed shadow root on `document.documentElement`, outside every app root) for hover boxes, the selection box, render flashes and picker mode. Frontend sends ids; backend resolves them to live nodes.

### D8 — The protocol

**Envelope** (every message, JSON-safe so an extension relay stays possible):

```ts
type Envelope = {
    source: 'loom-devtools';
    protocol: 1; // major; a mismatch is refused at hello
    session: string; // random per backend boot; stale messages are dropped
    kind: 'request' | 'response' | 'event';
    id?: number; // request ↔ response correlation, per sender
    type: string;
    payload?: unknown;
    error?: { code: ErrorCode; message: string };
};
type ErrorCode =
    | 'protocol-mismatch'
    | 'not-connected' // a request before `hello`
    | 'unknown-id'
    | 'unknown-type'
    | 'not-editable'
    | 'invalid-value';
```

**Transport:** `window.postMessage` with `targetOrigin = self.origin`; receivers accept only `event.origin === self.origin` (`self.origin`, not `location.origin`: an `about:srcdoc` / `about:blank` document inherits its origin but reports `location.origin` as `"null"`), `event.source` equal to the expected peer window, and `data.source === 'loom-devtools'`.

**Lifecycle:**

```
frontend                         backend (page)
   │── hello {protocol} ───────────►│
   │◄─ {session, features,          │
   │    placement, selectedId?} ────│
   │── subscribe {topics} ─────────►│  installs hook on first push topic
   │◄──────── events (rAF-batched) ─│
   │                                │  pagehide → goodbye
   │◄──────────────── goodbye ──────│
   │── hello (retry 500 ms) ───────►│  popup survives reload, re-handshakes
```

**Ids:** one numeric namespace per session, assigned lazily by the backend (`WeakMap<object, number>`), monotonic, never reused. Tree nodes carry `kind: 'component' | 'effect'`; custom-element components are components whose name carries the tag. Version strings were dropped from the handshake: a build-time version can predate the changesets bump, and `protocol` is the compatibility contract.

**Requests** (frontend → backend):

| type               | payload               | response                                                                                    |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------- |
| `hello`            | `{ protocol }`        | `{ session, features, placement, selectedId? }`                                             |
| `tree.get`         | `{ rootId? }`         | `{ rootIds, nodes: TreeNode[] }` (flat)                                                     |
| `node.inspect`     | `{ id, path? }`       | `{ props, activities: ActivityRef[], lifeCycle, refs, owned }` or `{ value }`               |
| `activity.list`    | —                     | `{ activities: ActivityRecord[] }`                                                          |
| `activity.inspect` | `{ id, path? }`       | `{ value }`                                                                                 |
| `activity.update`  | `{ id, input }`       | `{}` — runs through the activity's transform                                                |
| `activity.reset`   | `{ id }`              | `{}`                                                                                        |
| `highlight`        | `{ id \| null }`      | `{}`                                                                                        |
| `pick`             | `{ on }`              | `{}` — result arrives as `selected`                                                         |
| `reveal`           | `{ id }`              | `{}` — scrolls the node into view                                                           |
| `log`              | `{ id }`              | `{}` — logs the live object to the page console, sets `globalThis.$loom`                    |
| `select`           | `{ id \| null }`      | `{}` — the page's selection outline                                                         |
| `open`             | `{ placement }`       | `{}` — moves the HUD to the dock or a popup (the pop-out button's request)                  |
| `close`            | —                     | `{}` — closes the HUD                                                                       |
| `subscribe`        | `{ topics: Topic[] }` | `{}` — replaces the set; `Topic = 'tree' \| 'renders' \| 'activities' \| 'flash' \| 'perf'` |

`TreeNode = { id, kind, name, tag?, key?, parentId?, childIds }`. `ActivityRecord = { id, name, value: Encoded, pending, editable, subscriberIds }` — `subscriberIds` are the component instances using it.

**Events** (backend → frontend), batched per animation frame and coalesced, with a 100 ms timer fallback so a page whose frames are paused (a background tab behind a focused popup) still flushes:

| type               | payload                                                     |
| ------------------ | ----------------------------------------------------------- |
| `tree.changed`     | `{ ids }` — nearest surviving ancestors of changed subtrees |
| `renders`          | `{ entries: { id, ms, causeId? }[] }`                       |
| `activity.changed` | `{ id, value: Encoded, pending }` per id, last wins         |
| `selected`         | `{ id }` — from the picker or `loom.inspect()`              |
| `pick.ended`       | — the picker finished (selected or cancelled)               |
| `goodbye`          | —                                                           |

**Value encoding** — a tagged union, encoded at request time against the live value:

```ts
type Encoded =
    | { t: 'undefined' | 'null' | 'promise' | 'circular' | 'unserializable' }
    | { t: 'bool'; v: boolean }
    | { t: 'num'; v: number | 'NaN' | 'Infinity' | '-Infinity' | '-0' }
    | { t: 'str'; v: string; length?: number } // length set when truncated (> 500)
    | { t: 'bigint' | 'symbol' | 'date'; v: string }
    | { t: 'fn'; name: string }
    | { t: 'error'; name: string; message: string }
    | { t: 'array'; length: number; items?: Encoded[] }
    | {
          t: 'object';
          ctor?: string;
          size: number;
          entries?: [string, Encoded][];
      }
    | { t: 'map' | 'set'; size: number; entries?: [Encoded, Encoded][] }
    | { t: 'node'; tag: string; id?: number } // id when it's a component root
    | { t: 'activity'; id: number; name: string }
    | { t: 'component'; name: string }; // a ContextFunction value (e.g. children)
```

Inline depth budget 2; collections list the first 100 entries; deeper or omitted parts are fetched with `path` (keys/indices from the inspected root). `activity.update` accepts JSON input only; a non-JSON current value marks the activity `not-editable` in the HUD.

### D9 — Loader registration and the build key

`registerDevtools(loader)` (core `./devtools`) stores the loader; `loom.devtools.enable()` calls it, then hands the loaded backend core's primitives. With no loader registered, `enable()` warns once with the remedy (set `devtools` in `loom.config`, or call `registerDevtools`). The build tool implements `devtools` by injecting that registration into the entry: `'dev'` in development builds, `'lazy'` in both modes. Default `'dev'` with `@loom-js/devtools` not installed skips silently; an explicit `'dev'` / `'lazy'` without the package fails the build naming the missing dependency.

## Risks / Trade-offs

- [Popup blocked when opened from the console (no user activation)] → `open('popup')` falls back to the dock with a console hint; the dock's pop-out button is a real click.
- [Strict CSP blocks the HUD's inline document (`srcdoc` / `document.write`)] → documented limitation; the console API and formatters, which load as ordinary script, still work.
- [Module-tail injection misses non-column-0 or re-exported-later declarations] → explicit `name` covers them; fixture tests pin the matched shapes.
- [Hot-path regression from hook sites] → bench before/after; the sites are a single null check, timings only taken with the hook set.
- [Production exposure with `'lazy'`] → no new capability: anyone with the console can already reach exported activities; names are opt-in and source paths never ship.
- [Pink CSS inflates the frontend bundle] → it loads only on enable; trimming to used selectors is a later optimization, not a correctness issue.
- [Protocol drift between a cached popup and a reloaded page] → `protocol` major checked at `hello`; `session` drops stale traffic.

## Migration Plan

Additive throughout: no existing API changes shape. `component`'s second parameter is new and optional. Rollback = remove the `devtools` key (or set `false`) and uninstall the package; core primitives are inert without a backend.

## Open Questions

- Default dock edge and size, and whether the dock is resizable in v1 — HUD polish, decided during implementation.
- Whether `tree.changed` should graduate to op-diffs if snapshot refetch proves slow on large trees — measure first.
