## Purpose

Defines the project's obligations for the SPA router. It began as a deliberately narrow spec covering only the link-activation policy: which activations the router may claim for in-place History-API navigation, and which must fall through to the browser untouched because they carry a native intent (new tab, new window, download) or were already consumed by another handler. The `unify-routing` change (2026-08-15) widened it to the unified routing pipeline: zero-config location reactivity, a single history pipeline per window, window-scoped router instances, and DOM-free route registration. The `docs-readiness` change (2026-08-16) added hash/anchor navigation: fragment-carrying navigations scroll their anchor target while the activity pipeline stays quiet. The `core-api-follow-ups` change (2026-08-19) added the route guard: a table-level predicate that can suppress a valid match's route emission without silencing the raw location layer.

## Requirements

### Requirement: Link activations preserve native browser intents

The SPA router SHALL claim only plain, unconsumed link activations; any activation carrying a native modifier intent or already handled elsewhere SHALL fall through to the browser untouched.

#### Scenario: plain left-click routes via the History API

- **WHEN** `route(event)` receives an unmodified primary-button click
- **THEN** the event's default is prevented and navigation proceeds via `pushState` (or `replaceState` with `replace`)

#### Scenario: modified clicks fall through

- **WHEN** the activation carries `ctrlKey`, `metaKey`, `shiftKey`, or `altKey`
- **THEN** the router returns without preventing the default — new-tab, new-window, and download intents keep their native behavior

#### Scenario: already-consumed events fall through

- **WHEN** the event's default was already prevented before reaching `route()`
- **THEN** the router does not navigate and does not push history

#### Scenario: middle-clicks never reach the router

- **WHEN** a link is middle-clicked
- **THEN** no `click` event fires (`auxclick` semantics), so the router is not involved and the native new-tab behavior proceeds

### Requirement: Location reactivity requires no route table

The router SHALL expose zero-config subscriptions to raw `Location` changes — an effect form (`locationEffect`) and a watcher form (`watchLocation`) — that emit without any route table being registered.

#### Scenario: locationEffect renders without createRoutes

- **WHEN** an app that never calls `createRoutes` renders `locationEffect(({ value: location }) => ...)`
- **THEN** the effect runs with the current `Location` and re-runs on every navigation

#### Scenario: watchLocation observes navigation without createRoutes

- **WHEN** `watchLocation(handler)` is registered and a navigation occurs
- **THEN** the handler is called with the new `Location`
- **AND** no route table was required

### Requirement: One history pipeline per window

All routing reactivity for a given window SHALL flow through a single layered pipeline — one history listener feeding a raw location activity, whose match transform feeds the route activity — with no parallel routing state.

#### Scenario: Location and route subscribers observe the same navigation

- **WHEN** a navigation occurs while both a location-layer subscriber (`locationEffect`/`watchLocation`) and a route-layer subscriber (`routeEffect`/`watchRoute`) are registered
- **THEN** both observe it, sourced from the same pipeline (the route layer contingent on a route-table match)

#### Scenario: The legacy routing module is removed

- **WHEN** a consumer imports `router`, `onRoute`, or `onRouteUpdate` from the package
- **THEN** the import fails — the exports were removed pre-1.0 without a deprecation bridge, replaced by `locationEffect`, `route`, and `watchLocation` respectively

### Requirement: The router instance is scoped to the rendering window

Router state SHALL be keyed by the resolved provider window: one instance per window, created lazily, never shared across windows.

#### Scenario: Browser has exactly one router

- **WHEN** routing APIs are used in a browser across multiple components and renders
- **THEN** they all resolve the same router instance for the lifetime of the page

#### Scenario: Server renders are isolated

- **WHEN** two server renders run with different injected windows and different request URLs
- **THEN** each resolves its own router instance and matches its own URL
- **AND** neither observes the other's location or subscriptions

### Requirement: Route registration is DOM-free at call time

`createRoutes` SHALL capture the route table without touching the DOM, so calling it at module scope is safe in any runtime; history wiring defers to first use inside a DOM scope.

#### Scenario: Module-scope createRoutes off-browser

- **WHEN** a module calls `createRoutes({ config })` at import time in a runtime with no `window`
- **THEN** the import completes without error

#### Scenario: Late-constructed router sees the captured table

- **WHEN** the table was captured at import time and a router is first constructed later (e.g. inside a server render scope)
- **THEN** route matching uses the captured table immediately

#### Scenario: Repeat registration replaces the table

- **WHEN** `createRoutes` is called a second time
- **THEN** the new table replaces the previous one for subsequent matching

### Requirement: Hash navigations scroll to their anchor target

The router SHALL scroll the anchor target identified by the location's `#fragment` into view: immediately for same-page hash navigations, and — for cross-page navigations and initial loads — once the settlement signal resolves (bounded), so anchors produced by framework-tracked async work exist for the single attempt. Hash-only navigations SHALL NOT re-run route matching, reload page content, or emit on the location/route activities, and the native-intent fallthrough policy for modified or consumed activations SHALL apply to hash links unchanged. The scroll SHALL be the default, not an invariant: `route(event, { scroll: false })` SHALL perform the navigation with every other guarantee of this requirement intact and no fragment scroll of any kind.

#### Scenario: same-page hash click scrolls to the anchor

- **WHEN** `route(event)` handles a plain activation whose href differs from the current location only by `#fragment`, and an element with that fragment's id exists
- **THEN** the URL updates via the History API and the element is scrolled into view, with no route-activity or location-activity emission and no page reload

#### Scenario: cross-page navigation with a hash scrolls once settled

- **WHEN** `route(event)` navigates to a different route whose href carries a `#fragment`
- **THEN** the fragment's element is scrolled into view once the new route's tracked content has settled

#### Scenario: initial load with a hash scrolls once settled

- **WHEN** the app boots on a URL carrying a `#fragment` whose target element is produced by framework-tracked async work (a lazily-imported route chunk, or content fetched through an activity transform)
- **THEN** the element is scrolled into view once settlement resolves, even though it did not exist at native anchor-scroll time or at the first routed render

#### Scenario: a reload behaves like an initial load

- **WHEN** the page is reloaded on a URL carrying a `#fragment` whose target arrives with tracked async content
- **THEN** the settled scroll attempt fires the same way — the fragment outranks any saved restoration offset (the router owns restoration; see the restoration requirement below)

#### Scenario: missing anchor target is a silent no-op

- **WHEN** a hash navigation's fragment matches no element id by the time the scroll is attempted
- **THEN** no scroll occurs, no error is thrown, and a later navigation is unaffected

#### Scenario: empty fragment scrolls to the top

- **WHEN** a hash navigation's fragment is empty (`#`)
- **THEN** the window scrolls to the top

#### Scenario: hash scrolling stays inert off-browser

- **WHEN** route content settles under a server render whose provider DOM lacks CSSOM view APIs (`scrollIntoView`)
- **THEN** the pending-hash consumption no-ops without throwing

#### Scenario: same-page hash navigation opts out of the scroll

- **WHEN** `route(event, { scroll: false })` handles a same-page `#fragment` navigation whose target element exists
- **THEN** the URL updates via the History API, no location-activity or route-activity emission occurs, and the element is not scrolled into view

#### Scenario: cross-page navigation opts out of the deferred scroll

- **WHEN** `route(event, { scroll: false })` navigates to a different route whose href carries a `#fragment`
- **THEN** the routed page content loads and renders, and no fragment scroll occurs after the render

#### Scenario: empty fragment opts out of the top scroll

- **WHEN** `route(event, { scroll: false })` handles a navigation whose fragment is empty (`#`)
- **THEN** the URL updates and the window does not scroll to the top

#### Scenario: the default keeps scrolling

- **WHEN** `route(event, options)` handles a hash navigation and `options.scroll` is omitted
- **THEN** the navigation scrolls exactly as it does without any options

### Requirement: Fragmentless navigations land at the top

A route-changing navigation performed via `route()` whose href carries no `#fragment` SHALL scroll the window to the top after the routed content renders, without animation regardless of the page's `scroll-behavior` CSS. History traversal (`popstate`) SHALL NOT be scrolled by the router — the browser's own scroll restoration owns it. `route(event, { scroll: false })` SHALL suppress the top scroll exactly as it suppresses fragment scrolls.

#### Scenario: pagination from a scrolled position lands at the top

- **WHEN** the user activates a fragmentless route navigation while scrolled partway down the current page
- **THEN** the new route's content renders and the viewport sits at the top, instantly

#### Scenario: back/forward keeps browser restoration

- **WHEN** the user traverses history to a previously visited route
- **THEN** the router performs no scroll of its own and the browser's scroll restoration applies

#### Scenario: the opt-out covers the top scroll

- **WHEN** `route(event, { scroll: false })` performs a fragmentless route navigation
- **THEN** the viewport keeps its position

### Requirement: Route guard gates route emissions

`createRoutes` SHALL read its `guard` option (`guard?: (routeValue: RouteValue) => boolean`) into the route table with the same last-call-wins replacement semantics as `fallback`. On every navigation that produces a valid route match, the router SHALL invoke the guard with the candidate `RouteValue` before emitting it; a `false` verdict SHALL suppress the emission — route effects and watchers do not fire and page content does not change — while the raw location layer (layer 1) still observes the navigation. With no guard registered, matching SHALL behave exactly as before.

#### Scenario: guard passes a match

- **WHEN** a navigation matches a configured route and the registered guard returns `true` for its `RouteValue`
- **THEN** the route emission proceeds — route effects fire and the matched page loads as if no guard existed

#### Scenario: guard suppresses a match

- **WHEN** a navigation matches a configured route and the registered guard returns `false`
- **THEN** no route value is emitted — route effects and watchers do not fire and the rendered page content is unchanged (the fallback on first load)

#### Scenario: location layer is unaffected by suppression

- **WHEN** the registered guard returns `false` for a navigation
- **THEN** `locationEffect` and `watchLocation` subscribers still observe that navigation's `Location`

#### Scenario: guard sees the candidate route value

- **WHEN** the guard runs for a navigation matching a parameterized route
- **THEN** its argument carries the candidate `matchedRoute`, `params`, `pathname` and `raw` location for that navigation

#### Scenario: no guard means no gating

- **WHEN** `createRoutes` is called without a `guard`
- **THEN** every valid match emits exactly as it did before this capability

### Requirement: Scroll restoration is settlement-exact

The router SHALL own scroll restoration for its window (`history.scrollRestoration = 'manual'`), capturing the entry's scroll offset into its history state as scrolling comes to rest (and at push-time exit), and replaying a saved offset after the settlement signal resolves (bounded) on reload and history traversal — so the restored position is computed against fully-rendered content. A URL fragment SHALL outrank a saved offset; an entry with no saved offset SHALL remain at the top. All other scrolls of the navigation contract are unchanged.

#### Scenario: reload returns to the exact position

- **WHEN** a user scrolls a client-rendered page and reloads
- **THEN** after tracked content settles, the viewport returns to the saved offset — not a clamped intermediate, not the top

#### Scenario: traversal restores like reload

- **WHEN** the user navigates away and returns via back/forward
- **THEN** the entry's saved offset replays after settlement, exactly

#### Scenario: no saved state stays at the top

- **WHEN** a fresh entry (no captured offset) boots without a fragment
- **THEN** the viewport stays at the boot position and no restoration scroll fires
