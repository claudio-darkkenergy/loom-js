# spa-routing — delta

## ADDED Requirements

### Requirement: Hash navigations scroll to their anchor target

The router SHALL scroll the anchor target identified by the location's `#fragment` into view: immediately for same-page hash navigations, and after the routed page content renders for cross-page navigations and initial loads. Hash-only navigations SHALL NOT re-run route matching, reload page content, or emit on the location/route activities, and the native-intent fallthrough policy for modified or consumed activations SHALL apply to hash links unchanged.

#### Scenario: same-page hash click scrolls to the anchor

- **WHEN** `route(event)` handles a plain activation whose href differs from the current location only by `#fragment`, and an element with that fragment's id exists
- **THEN** the URL updates via the History API and the element is scrolled into view, with no route-activity or location-activity emission and no page reload

#### Scenario: cross-page navigation with a hash scrolls after render

- **WHEN** `route(event)` navigates to a different route whose href carries a `#fragment`
- **THEN** the routed page content loads and renders first, and the fragment's element is then scrolled into view

#### Scenario: initial load with a hash scrolls after the first routed render

- **WHEN** the app boots on a URL carrying a `#fragment` whose target element is produced by lazily-imported route content
- **THEN** the element is scrolled into view after the first routed render, even though it did not exist at native anchor-scroll time

#### Scenario: missing anchor target is a silent no-op

- **WHEN** a hash navigation's fragment matches no element id by the time the scroll is attempted
- **THEN** no scroll occurs, no error is thrown, and a later navigation is unaffected

#### Scenario: empty fragment scrolls to the top

- **WHEN** a hash navigation's fragment is empty (`#`)
- **THEN** the window scrolls to the top

#### Scenario: hash scrolling stays inert off-browser

- **WHEN** route content settles under a server render whose provider DOM lacks CSSOM view APIs (`scrollIntoView`)
- **THEN** the pending-hash consumption no-ops without throwing
