# @loom-js/core

## 0.7.0

### Minor Changes

- 9e78b34: Add dehydrated state — the server-to-client data handoff for pre-rendered pages, so a primed hydration never refetches. `resource(key, fetcher)` is a per-window keyed async memo apps route data loads through (concurrent callers share the in-flight fetch; rejections are never cached, so a later call retries). After a server render, `dehydrate(window)` (server entry) captures that window's settled resource values as a plain JSON-serializable object — pending or unserializable entries degrade to a client-side cache miss — and `serializeState(state)` (server entry) makes it safe to inline in an HTML script element (`<`, U+2028, U+2029 escaped). On the client, `primeResources(state)` seeds the resource cache before boot — ahead of `hydrate` and `init` alike — so primed keys resolve without ever invoking their fetcher and hydration settles from local data instead of the network. `renderToString` → `dehydrate` → embed → `primeResources` → `hydrate` is the full story; non-adopting apps pay no bytes.
- b0d0d35: Server rendering: new `@loom-js/core/server` entry with `renderToStringSync(app, { window, url })` — renders a loom app to an HTML string outside the browser (SSR at request time, SSG/prerender at build time) through the exact same render path the client runs, against a caller-supplied DOM (e.g. a linkedom `parseHTML` window). loom takes no new dependency; the browser bundle is untouched. (The async `renderToString`, the go-to entry for route-table apps, ships in this same release — see the unified-routing changeset.)

    **How it works**: rendering now resolves `window`/`document` (and every `instanceof`-checked DOM constructor) through a render-scoped provider (`src/lib/dom.ts`) that defaults to the real `window` in browsers — no client behavior change, benchmark-verified no measurable cost. `renderToStringSync` swaps the provider for the synchronous duration of a render, making concurrent server renders isolated by construction. The injected window is normalized for linkedom's gaps (`NodeFilter` constants, a plain-object `location` built from `url`, a `history` shim).

    **Server semantics**: `onCreated`/`onBeforeRender`/`onRendered` fire as usual; `onMounted`/`onUnmounted` never fire server-side. `defineElement` registrations are applied to each injected window automatically. Per-render lifecycle registrations are released after serialization, so long-running SSR processes don't accumulate.

    **Also fixed along the way**: importing `@loom-js/core` without a browser no longer crashes (router/routing/config touched `window` at module load — they now initialize lazily), and cached template fragments are re-cloned via `importNode` so custom elements upgrade correctly in whichever document is rendering.

- 542dd65: Core API follow-ups from the README scrub:

    - **BREAKING**: `init`'s `append?: boolean | null` prop is replaced by `placement?: 'replace' | 'append' | 'prepend'` (default `'replace'`). Migrate mechanically: `append: true` → `placement: 'append'`, `append: false` → `placement: 'prepend'`, `append: null`/omitted → omit.
    - `createRoutes`' previously-declared-but-dead `guard` option now works: `guard?: (routeValue: RouteValue) => boolean` runs on every valid route match with the candidate `RouteValue`; returning `false` suppresses the route emission (route effects & watchers stay silent, page content stays put) while the raw location layer still fires and the URL keeps the navigation — auth flows call `redirect()` inside the guard.
    - `lazyImport` now returns the typed `LazyImportActivity<ImportType>` (exported) on both cache paths, so `effect`/`watch`/`value()` carry `ImportType | undefined` without narrowing; `importLazy` is typed as `LazyImportActivity<ContextFunction | undefined>`.

- d032619: Type-surface cleanup (breaking, types-only — no runtime behavior changes).

    **Removed exports** (migration in parentheses): `ComponentArgs` (→ `ComponentOutputProps`), `ComponentProps` (→ `ComponentOutputProps`), `ComponentOptionalProps` (→ `ReservedProps`), `RenderFunction` (→ `TemplateFunction`), `RenderProps` (→ `ComponentOutputProps`), plus the dead `ComponentBaseArgs` (→ `ComponentBaseProps`), `GlobalConfig`, `GlobalWindow`, and `NodeFilter` (the DOM global was always used at runtime).

    **Required props are now enforced**: `Component<Props>` and `SimpleComponent<Props>` require the props argument when `Props` has at least one required member; propless calls still type-check when all props are optional.

    **New `simple()` factory**: the pass-through counterpart to `component()`. Wrap pass-through implementations in `simple<Props>(render)` — the render function always receives a props object (`{}` is supplied at runtime on propless calls), so it can destructure without a `= {}` default, while callers keep the conditional `SimpleComponent<Props>` signature. Bare functions annotated `SimpleComponent<Props>` with all-optional `Props` must otherwise tolerate `undefined` props themselves; migrating them to `simple()` is the intended pattern.

    **Tightened signatures**: `LifeCycleHandler`, `SyntheticRouteEventListener`, and `AppInitProps.onAppMounted` now return `void` instead of `any` (callbacks returning values still type-check); `ReactiveComponent` defaults to `<unknown, TemplateTagValue>`; `GetProps` falls back to `never`; `TaggedTemplate` declares its bound context as a proper `this` parameter. The `Props` generic now threads through `component()` end-to-end, so template functions see fully-typed props without casts.

- 2f3f84c: Docs-readiness: hash/anchor navigation & zero-value attributes.

    **Hash / anchor navigation** — `route()` now restores the native anchor jump its `preventDefault` suppresses. Same-page `#fragment` navigations scroll the matching `id` into view immediately (a bare `#` scrolls to the top) without waking the location/route activities; fragment-carrying navigations that change the route — including the initial page load, whose native scroll fires before lazily-imported content exists — scroll after the routed content renders. The deferred scroll is a single attempt (a missing target no-ops; the next navigation drops an unconsumed fragment), and `scrollIntoView()` leaves smoothness to the page's `scroll-behavior` CSS. Off-browser (server renders), the scroll paths are inert.

    **Zero-value attributes** — the falsy-removal rule for interpolated attribute values now exempts the number `0` in every attribute-setting path (attr slots, `$attrs` entries, `$`-prefixed passthroughs), matching the text path's existing zero-preservation. `tabindex=${0}` / `min=${0}` render `"0"`, and `value=${0}` sets the value property. Behavior change: `value={0}`-style bindings previously removed the attribute — `false`/`null`/`undefined`/`''` remain the removal idiom.

- b547065: Style bindings now apply by replacement: an object or array `style=` value (attr slot or `$attrs` entry) fully determines the element's inline style on each application, and a value resolving to zero properties removes the `style` attribute entirely — the template placeholder token can no longer leak into the DOM through an empty-resolving style value. Behavior change: a re-render whose new style value drops a property now removes that property from the element (previously it stayed applied), aligning object/array values with the string value's existing replace semantics. Entries within a single array value still merge in order.
- 9def3e9: Improve the framework console (`loomConsole` / `loom.console`) on three fronts. **Warnings and errors always surface**: `warn`/`error` bypass the debug gate entirely — attr-misuse warnings and the `hydrate`/`renderToString` `maxWait` expiry warnings now reach the console in development and production alike, with no `setDebug` opt-in (apps that relied on debug-off silence will newly see genuine warnings — intended). **Call-site attribution is fixed**: method access returns a native console method bound to the console (or a shared no-op when the gate is closed) instead of a wrapper closure, so DevTools attributes each message to the framework call site that logged it, not to `loom-console.ts`; the gate is read at property-access time, so don't cache method references. **Debug narration is tamed**: the per-value "should update" log folds into a collapsed `loom (Updating…)` group per update cycle, and the double-gating `console` scope is gone — each debug call site is gated once, by its own scope. `ConfigDebugAllowable` shrinks to `activity`, `creation`, `mutations`, `updates` (the `console`, `warn`, and `error` keys are removed — a type-level break for `setDebug`/`debugScope` callers passing them; runtime tolerates unknown keys).
- 64c8ea2: Add client hydration for pre-rendered pages: `hydrate({ app, root, globalConfig, onAppMounted, ready, maxWait })` boots on top of server-rendered markup with a single atomic swap once the app has settled — lazy route content and async activity work included — so the takeover is invisible (no shell/fallback flashes). The new `settled()` export is the underlying quiescence signal: it resolves when no framework-mediated async work (thenables returned by activity transforms) is pending for the current window, confirmed by one macrotask of quiet. `renderToString` → `hydrate` is now the complete pre-rendering story; `init`-only apps pay no bytes for it.
- 9cc3552: Unified routing: the two parallel routing systems (deprecated `routing.ts` pub/sub and the route-matching router) are now one layered pipeline per window — a raw location activity (always fires) whose match transform feeds the route activity — with a single history listener per router instance.

    **New API — layer 1 goes public**: `locationEffect(cb)` (effect over the raw `Location`, zero-config — no route table needed) and `watchLocation(handler)` (the watcher form, returns an unsubscriber). Named symmetric with layer 2's `routeEffect`/`watchRoute`.

    **Removed (breaking, pre-1.0)**: the legacy `routing.ts` module is gone without a deprecation window. Migrate `router(cb)` → `locationEffect(cb)`, `onRoute(e, opts)` → `route(e, opts)` (which additionally leaves modified clicks and already-consumed events to the browser), and `onRouteUpdate(handler)` → `watchLocation(handler)`.

    **SSR fixes**: `createRoutes` is now DOM-free at call time — calling it at module scope (the normal app shape) no longer crashes off-browser imports; it captures the route table into an app-global store (a repeat call replaces the table — last call wins) and history wiring defers to first use inside a DOM scope. Router instances are keyed by the provider window (`WeakMap`): the browser keeps exactly one router for the page's lifetime, while each server render's injected window resolves its own isolated instance, garbage-collected with the window.

    **New server entry export**: `renderToString(app, { window, url })` — the async, go-to server render. It renders through the same path as the synchronous primitive, drains settled route/lazy-import work (`createRoutes` route pages, `lazyImport`) until the markup is quiet, and resolves with the page content serialized; concurrent calls are safely serialized internally. The synchronous primitive is exported as `renderToStringSync` (Node's `readFile`/`readFileSync` naming convention: the unmarked name belongs to the recommended path) — it serializes only what settled synchronously, which for a route-table app is the shell/fallback.

- 4d3625c: `renderToString` now gates on the settlement signal (`settled()`) instead of the markup-quiet polling drain, so framework-tracked async work — async activity transforms, route/page imports, `lazyImport` — serializes fully however many macrotasks it spans, with unbounded chain depth. The wait is bounded by a new `maxWait` option on `RenderToStringOptions` (default `4000`ms, `Infinity` to disable — symmetric with `hydrate`'s `maxWait`): on expiry the render serializes what has landed and warns with the pending count via the debug-gated framework console. Async work outside an activity transform is invisible to the signal, as documented for `hydrate`.

### Patch Changes

- 406c309: Fix the array-reconciliation limitation: a fragment-rooted value (a named-slot region or a rootless `<>` fragment-template component) passed as an item of a children array now renders its nodes instead of stringifying to `"[object Text],[object HTMLDivElement]"`. Each such item reconciles as one group — reorders move all of its nodes together with node identity preserved for keyed items, truncation removes the whole group, kind changes (fragment ⇄ element ⇄ text) fully replace the previous rendering, and an item that resolves to zero nodes keeps an empty text anchor so a later update fills back in at the right position. Interpolating a region directly and passing it as a children-array item are now equivalent; no API change.
- b8f994b: Refactor special-attribute dispatch in `get-attr-update.ts` from a `switch(true)` to a factory map (`specialAttrUpdaterFactories`) with event/default fallbacks — behavior unchanged; new special attribute types now extend the map without touching dispatch logic.
- 00a0855: README scrub: document the full `activity` signature (transforms as the async-data path, `deep`/`force` options, complete return shape), all five life-cycle hooks with timing, the complete `init` props, and previously missing coverage for `simple`, `lazyImport`, and the boot config surface (`globalConfig`, `appendEvents`). Replace the retired `PrerenderSsgWebpackPlugin` example with the `renderToString` SSG idiom, and fix every broken code example — all examples now type-check against the package.

## 0.6.0

### Minor Changes

- b61b1d6: Core gains its kit-agnostic element components — the element-level survivors of the upcoming `@loom-js/tags` retirement, all tree-shakeable named exports:

    - **`RouteLink`** — an anchor wired to the SPA router: same-origin activations route via `route()` with no caller-supplied handler; `target="_blank"` and cross-origin hrefs fall through to the browser default.
    - **`Svg`** — sprite composition (`path` + `svgId` → `<use href="path#id">`, `fill="currentColor"`, `size`/`height`/`width`).
    - **`Picture`** — responsive image with the chooser built in: a `sources` array renders `<picture>` + `<source>`s + `<img>`; no sources renders the bare `<img>`. `SourceProps` exported as a type.
    - **`el(tagName)`** — a plain HTML tag as a memoized component value, for `is=` polymorphism, third-party render callbacks, and props transformers (`is=${el('footer')}`, `el('h2')({ children })`). Void tags render childless.

    Also fixes tree-shaking for these additions: top-level `component()` definitions now carry `/* @__PURE__ */` annotations, preserved through the build (`removeComments` dropped from the package tsconfig; terser configured with `preserve_annotations`), so bundlers drop unused element components entirely.

- cc42b73: `el(tagName)` widens its flat prop surface to match what the retired `@loom-js/tags` wrappers exposed, so converted delegators pass one shape to any root: `id` and `style` now map to their attributes alongside `className` (previously they only worked via `attrs`), and `onClick` binds the click listener (previously clicks required `on: { click }`). `PossibleAttrs` also admits `StyleProp` values on the type level — the runtime already handled style arrays in `$attrs`.
- cc11703: Custom element registration is now explicit, via a new `defineElement()` export.

    **Behavior change:** `component()` no longer registers a custom element. It previously called `registerCustomElement({ name: templateFunction.name, ... })`, deriving the element name from the render function's `.name`. That path was unreachable in practice — `registerCustomElement` bails on a falsy name, and the idiomatic form used everywhere (`component((html, props) => …)`) passes an anonymous arrow whose `.name` is `''`. Only the undocumented `component(function Named(…) {})` form ever defined an element. Nothing in this repo, `@loom-js/pink`, or `apps/loom` relied on it.

    **New API:** `defineElement(name, templateFunction, options?)` is `component()` plus registration, returning the same callable `Component` so it still composes inside loom templates. Use one or the other for a given component, never both.

    ```ts
    export const Card = component(
        (html, props) => html`
            …
        `
    ); // no element
    export const PinkButton = defineElement(
        'pink-button',
        (html, props) => html`
            …
        `
    ); // + <pink-button>
    ```

    - **Encapsulation is opt-in.** A registered element renders into the **light DOM** by default, where application and design-system CSS applies normally — inverting the previous `shadowInit = { mode: 'open' }` default, which would have rendered a themed component completely unstyled. Pass `options.shadow` to encapsulate, and `options.styles` to adopt stylesheets onto the shadow root. `mode` should stay `'open'`; `'closed'` adds no style encapsulation and only makes `element.shadowRoot` unreachable.
    - **Invalid and duplicate element names now throw** with a message naming the element, instead of silently returning. Names are used verbatim — the old `toKebabCase` derivation is gone.
    - **`register-custom-element` is no longer reachable from every consumer.** It is dropped from the `lib/templating` barrel and imported by path from `define-element`, and `@loom-js/core` is now marked `"sideEffects": false`. Verified: an `apps/loom` build, which never calls `defineElement`, no longer emits `customElements.define`, `attachShadow`, or the element class.
    - **Clearer warning** when a `$`-prefixed prop is set on a tag that is not a registered custom element (previously reported as "must be an object literal").
    - **First real coverage** for the feature — 16 cases covering explicit definition, `$`-attribute→camelCase prop mapping, uncoerced object/function props from a template, children pass-through, `<>…</>` fragment roots, both light-DOM and shadow paths, and the two error cases. It is also now documented in `packages/core/README.md`, which previously said nothing about custom elements.

    Registration of plain-function (`SimpleComponent`) components is intentionally out of scope — `defineElement` accepts a `TemplateFunction` only.

- 531d0de: Automatic unmount teardown: when a component's DOM is genuinely detached, its `activity.effect` subscriptions are disposed and released from the activity's scoped actions (cascading through child contexts), so detached trees stop re-rendering and are no longer pinned in memory; torn-down contexts re-subscribe cleanly on remount. Behavior fix included: a component _moved_ within the DOM (e.g. an array reorder) no longer fires a spurious `onUnmounted` or silently loses its lifecycle registration — `onUnmounted` now fires only for genuine removals.
- d563e70: Components can now receive multiple labelled content regions — named slots. A top-level child of a component element carrying a `slot="name"` label is grouped into that region and delivered as `props.slots.name`, with the unlabelled remainder staying ordinary `children`:

    ```ts
    const Card = component(
        (html, { children, slots }) => html`
            <article>
                <header>${slots?.header}</header>
                <div>${children}</div>
            </article>
        `
    );

    html`
        <${Card}>
            <h2 slot="header">Title</h2>
            <p>Body</p>
        </>
    `;
    ```

    The functional form is the same call the element syntax compiles to: `Card({ slots: { header: … }, children: … })`. Distribution is loom's in the light DOM only — `slot` attributes nested deeper than the region's top level (e.g. children of a shadow-rooted custom element) keep their native meaning and pass through untouched. Malformed labels (`slot=${name}`, valueless, unquoted, or empty) throw at transform time.

    Also fixes a latent fragment bug this feature surfaced: an array-valued interpolation at the top level of a fragment template (e.g. a named region forwarded into another component element's children) silently dropped its nodes — insertion now anchors on `parentNode`, which a `DocumentFragment` provides, instead of `parentElement`, which it does not.

- 2b57903: Reactive attribute bindings: `activity.bind(select?)` produces an `AttrBinding` usable as any template attribute value (standard attrs and `$attrs` entries) — the attribute applies the projected current value immediately and stays in sync with every activity update without re-rendering the component. Bindings are swap-safe across re-renders (at most one live subscription per attr slot) and are disposed automatically on unmount teardown. Also fixes a latent `$attrs` bug: a falsy entry value now removes the entry's own attribute instead of the literal `attrs` name.
- cff15a9: Component elements now accept spread props — `...${object}` in the attribute region spreads an interpolated object's entries into the props, exactly like the functional form always could:

    ```ts
    const PinkGridHeader = component<PinkGridHeaderProps>(
        (html, { attrs, className, id, on, slots, style }) => html`
            <${Header}
                ...${{ attrs, id, on, style }}
                className=${classNames(className, 'grid-header')}
            >
                ${slots?.col1}
            </>
        `
    );
    ```

    Spreads and named props apply with object-literal semantics: authored order, last-wins duplicates — `<${Header} ...${headerProps} className=${x}>` behaves exactly like `Header({ ...headerProps, className: x })`. Nullish and primitive spread values are a render-time no-op, matching `{ ...null }` in JS. A `slot` key inside a spread object arrives as an ordinary prop, never as a slot label (labels resolve at transform time), and markup-derived `children`/`slots` still win over spread-supplied ones. `...` anywhere other than immediately before an interpolation throws at transform time.

- 37833ac: Reactive subscriptions are now disposable: `reactiveEffect` returns an `Unsubscriber` that permanently stops the effect and removes it from every dependency set (idempotent, safe to call mid-trigger), `activity(...).watch` returns that unsubscriber, and `watchRoute` finally honors its documented unsubscriber contract. `activity.effect` render subscriptions are unchanged (context-managed); automatic unmount-driven teardown is a planned follow-up.
- 78975d7: Components now compose in templates using element syntax with attribute-style props:

    ```ts
    html`
        <${PinkButton}
            isOnlyIcon
            icon="icon-menu"
            onClick=${() => toggleSideNav(null)}
        />
    `;
    ```

    This is sugar over the existing `${Component({ … })}` composition form — the transform rewrites component tags before the native parser runs, once per template call site, with no new runtime semantics. Props come as boolean shorthand (`flag`), quoted static strings (`icon="icon-menu"`), and interpolated JS values passed by reference (`onClick=${fn}`); prop names are taken verbatim. Children go between the opening tag and the single closing form `</>`, reaching the component as its `children` prop in its own context. `key=${…}` participates in keyed reconciliation as usual. Malformed component syntax throws on first render, naming the offending construct, instead of silently mis-rendering. Templates without component tags pass through the pipeline byte-identical.

    Also fixes a latent bug for rootless (`<>`) templates: a top-level dynamic slot left `ctx.root` referencing detached placeholder nodes, because the root node-list was captured before path wiring replaced them.

### Patch Changes

- a32352e: Fix array-valued `activity()` reconciliation so effects no longer re-render (and DOM nodes no longer repaint) when an array update carries the same content.

    - `resolveCurrentValue` now shallow-clones array values, so `value()` and the stored current value are reference-isolated and can't be mutated to defeat change detection.
    - `shouldUpdate` gains an array branch gated on `deep`: with `{ deep: true }`, a same-content array update (new reference, equal elements in order) is treated as unchanged and does not re-run subscribed effects. `force` / `update(value, true)` still overrides.
    - Array reconciliation now honors a falsy context `key` (`0`/`''`) instead of collapsing it to the index (`?? i`), enabling value-keyed reuse for consumers that pass a stable `key` (e.g. `.map((item) => Component({ key: item }))`). Reordering such a list reuses each item's existing DOM node instead of repainting by position.
    - Removed leftover debug `console.log`s from `activity`, `component`, and the array text updater.

    Note: the numeric-key limitation originally noted here (numeric keys colliding with the index-based fallback keyspace during the outer interpolation's re-reconciliation) is resolved in the same release — see the accompanying `array-double-reconciliation` changeset. Both string and numeric keys now reuse their DOM node across a reorder.

- 15a96de: Fix keyed array reconciliation for numeric keys by making child-context cleanup non-destructive during the outer interpolation's re-reconciliation pass.

    An array driven by `activity.effect(...)` is reconciled twice into the same `parentCtx.children` map: first by the effect's own render (with the item **context functions**, keyed by each item's `key`), then again by the surrounding `${...}` interpolation (with the **already-resolved DOM nodes**, which carry no key and therefore fall back to the index keyspace). The second pass took `appendChildContext`'s non-`ContextFunction` branch and ran `children.delete(key)`, wiping the child context of any keyed item whose `key` equalled an index — so numeric keys (`1`, `2`, …) lost their context and their nodes were recreated on the next reorder.

    - `appendChildContext` now skips the cleanup delete when the reconciled value is a DOM `Node`. Legitimate component→text/primitive cleanup is preserved.
    - The public `key` prop is widened from `string` to `number | string`, matching the `children` map's existing `Map<number | string, …>` keyspace.

    This resolves the numeric-key limitation documented in the previous array-reconciliation release; numeric and string keys now both reuse their DOM node across a reorder.

- fc33c15: Remove leftover debug `console.log` calls from custom element registration.

    `registerCustomElement` logged the resolved props on every custom element
    instantiation, and logged the mounted context again after mount — noise that
    reached consumer consoles in the published build. Both are gone.

    Also corrects the prop type passed to the component function during custom
    element instantiation (`ComponentInputProps` rather than the resolved
    `ComponentProps`). Type-level only; the value passed at runtime is unchanged.

- c427e40: Fix array-valued slot reconciliation: `appendChildContext` now returns a persistent child context for array values (kept under a derived `` `${key}[]` `` keyspace so it can never collide with a component context at the same slot key). Re-reconciling an array slot now reuses each item's live context, DOM node, and activity subscription instead of rebuilding from a throwaway context — fixing duplicated subtrees and accumulating `activity.effect` subscriptions when an effect re-renders a component with array `children` (e.g. the docs TOC toggle duplicating the whole docs container).
- a2ca4d2: `route()` now leaves every modified or already-consumed link activation to the browser. Previously only ctrl/cmd-clicks were excepted; shift-clicks (new window) and alt-clicks (download) were hijacked into an in-place SPA navigation, and events another handler had already `preventDefault()`ed were re-claimed. The guard now covers `ctrlKey`, `metaKey`, `shiftKey`, `altKey`, and `defaultPrevented`. Middle-clicks were never affected (they fire `auxclick`, not `click`).

    Internal: the `Router` class's route matching and param extraction moved into pure module-level helpers (`matchRoute`, `extractParams`) with no public API change, resolving the file's standing SRP audit entry.

## 0.5.2

### Patch Changes

- 8d36e85: @loom-js/loom:

    - Set custom style of italic node in rich text component & some minor cleanup.
    - Fixed the width of the side nav skeleton loader.
    - Update aside & side navigation behavior - will be scrollable when nav is taller than the screen & sticky when scrolling main content.
    - Add Github logo SVG to the layout header.
      @loom-js/core:
    - Update attribute update logic for style attribute - will now call `style.setProperty` when the property value is zero.
      @loom-js/pink:
    - `PinkSideNav` now uses `Nav` instead of `Div` as its default dynamic root node - updated for better semantics.
    - Add `display: contents` to `PinkTopNav` to more easily style their contents for flex alignment.
      @loom-js/tags:
    - Cleanup (remove) expected prop `title` from `Link` - can be passed w/ prop`attrs`.

    Add new environment variable for setting the Contentful GraphQL query variable for fetching preview vs. published content & connect them to the appropriate environments.

## 0.5.1

### Patch Changes

- 97df6b7: New utils, app enhancements, core fixes, and pink improvements.

## 0.5.0

### Minor Changes

- 41f2d14: Significant updates to core routing including refactoring exports into a class-based singleton & adding `createRoutes` which sets up app routing for pages using lazy loading, supporting code splitting.

    Pink Storybook stories completed for existing & newly added pink components while fixing a bunch of type errors and successful deployed builds.

    Added a new block component, footer, to tags' blocks.

## 0.4.1

### Patch Changes

- 1203343: Array value render optimization using `key`.

## 0.4.0

### Minor Changes

- d4c1db8: Storybook added for @loom-js/pink & other minor updates

## 0.3.28

### Patch Changes

- 6937dc7: Resolve distribution files for inclusion

## 0.3.27

### Patch Changes

- f6da399: CI & Package fixes.

## 0.3.26

### Patch Changes

- 8f1c5a0: Get all packages and apps to play well together in a monorepo setting using turbo repo for task orchistration.
