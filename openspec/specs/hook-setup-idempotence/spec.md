## Purpose

Defines the project's obligations for idempotent hook setup in a framework without reactive teardown. Because loom components cannot yet unsubscribe on unmount, any hook that registers a persistent global resource (a `matchMedia` listener, a route watcher, an activity effect) must guarantee that repeated calls do not stack duplicates: media-query hooks are memoized per query, toggle wiring is idempotent per activity-query pair, `matchQuery`'s unsubscribe actually removes the listener it registered, and the docs section's setup runs exactly once per app lifetime no matter how many times the section is mounted.

This capability covers the hook layer in `@loom-js/utils` and the docs-section setup in `apps/loom`; reactive teardown in `@loom-js/core` is a separate future capability.

## Requirements

### Requirement: Media-query hooks are memoized per query

`useMediaQuery` SHALL return the same activity instance for the same (normalized) query string across repeated calls, and SHALL register at most one `matchMedia` `change` listener per distinct query for the lifetime of the app. Distinct query strings SHALL still receive distinct activities and listeners.

#### Scenario: Repeated calls reuse the activity and listener

- **WHEN** `useMediaQuery` is called multiple times with the same query string (e.g. on every re-mount of a section)
- **THEN** every call returns the same activity instance
- **AND** only one `matchMedia` listener exists for that query

#### Scenario: Distinct queries stay independent

- **WHEN** `useMediaQuery` is called with two different query strings
- **THEN** each query gets its own activity and its own listener

### Requirement: Toggle wiring is idempotent per activity-query pair

`useToggle` SHALL register at most one media-query watcher per (toggle activity, query) pair. Repeated calls with the same pair SHALL be no-ops, so a breakpoint crossing produces exactly one toggle update regardless of how many times the consuming component has mounted.

#### Scenario: Re-mounting does not stack watchers

- **WHEN** a component calling `useToggle(someToggle, someQuery)` is mounted N times
- **THEN** a subsequent breakpoint crossing triggers exactly one update of `someToggle`
- **AND** manual toggle state is not overwritten by re-mounts (only by actual media-query changes)

### Requirement: matchQuery unsubscribe removes its listener

`matchQuery` SHALL remove the exact listener it registered when the returned `unsubscribeMql` is invoked, after which media-query changes SHALL NOT invoke the `onChange` handler.

#### Scenario: Unsubscribed handler stops firing

- **WHEN** a consumer calls `matchQuery(handler, query)` and later invokes the returned `unsubscribeMql`
- **THEN** subsequent media-query change events do not invoke `handler`

### Requirement: Docs-section setup registers global watchers exactly once

The docs section's setup (media-query toggle wiring, default-topic redirect watcher, topic-content route watcher, initial page fetch) SHALL run exactly once per app lifetime, regardless of how many times the docs layout is mounted. Route-driven actions registered by this setup SHALL act only when the current route belongs to the docs section.

#### Scenario: One topic fetch per navigation after repeated mounts

- **WHEN** the user enters and leaves the docs section N times and then navigates to a topic
- **THEN** exactly one topic-content fetch is issued for that navigation

#### Scenario: Default-topic redirect still works and stays scoped

- **WHEN** the user navigates to the docs root without a topic
- **THEN** they are redirected to the default topic
- **AND** navigating to routes outside the docs section never triggers that redirect
