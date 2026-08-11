## Purpose

Defines the project's obligations for the SPA router's link-activation policy: which activations the router may claim for in-place History-API navigation, and which must fall through to the browser untouched because they carry a native intent (new tab, new window, download) or were already consumed by another handler. This is a deliberately narrow first spec for the router — route matching, dynamic params, and lazy page loading remain unspecced until a future change widens this capability.

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
