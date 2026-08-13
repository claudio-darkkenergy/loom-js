## Purpose

Defines the docs section's toggle-rendering contract: the topic-TOC toggle updates the layout by mutating one class on the persistent container element (no content re-render, no refetch, node identity preserved), with its class-driving watch subscription balanced across docs entries and exits; the side-nav toggle remains a declarative effect boundary whose class always reflects the shared toggle state. The split is deliberate — the imperative escape hatch is reserved for the boundary whose re-render cost is real (see the change's design D1); a future core reactive-attribute-binding primitive would let the TOC site return to declarative form.

This capability covers `apps/loom/src/app/pages/docs/` and builds on `hook-setup-idempotence` (toggle state persistence) and `reactive-unsubscribe` (the watch unsubscriber).

## Requirements

### Requirement: TOC toggles mutate a class without re-rendering content

Toggling the topic TOC SHALL update the `_open` class on the existing container element — the container SHALL keep its DOM node identity and its rendered topic content, and no topic-content fetch SHALL occur.

#### Scenario: TOC toggle preserves the container and issues no fetch

- **WHEN** the user toggles the topic TOC
- **THEN** the container element's `_open` class reflects the new state
- **AND** the container is the same DOM node with the same topic content
- **AND** no topic-content request is issued

### Requirement: Side-nav toggles stay declaratively bound

The side nav's `_open` class SHALL always reflect the `sideNavToggle` state via its effect boundary, including after repeated docs entries and exits.

#### Scenario: Side-nav class tracks the toggle state

- **WHEN** the user toggles the side nav open or closed
- **THEN** the side-nav element's `_open` class reflects the new state

### Requirement: TOC watch subscription is balanced across docs entries

The TOC class-driving watch SHALL be released when the docs layout unmounts and re-established when it remounts, so that after any number of docs entries and exits a single toggle produces exactly one class transition.

#### Scenario: No watcher stacking after repeated entries

- **WHEN** the user enters and leaves the docs section several times and then toggles the TOC once
- **THEN** the container's class flips exactly once (no flicker or repeated transitions)
- **AND** manual toggle state still persists across docs re-entries per `hook-setup-idempotence`
