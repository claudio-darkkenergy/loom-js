# spa-routing — delta

## ADDED Requirements

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
