## MODIFIED Requirements

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
- **THEN** the settled scroll attempt fires the same way (the browser's scroll restoration may subsequently apply its own position; the router does not fight it)

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

## ADDED Requirements

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
