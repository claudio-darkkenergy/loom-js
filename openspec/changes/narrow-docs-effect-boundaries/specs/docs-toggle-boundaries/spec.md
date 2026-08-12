## ADDED Requirements

### Requirement: Toggles mutate classes without re-rendering

Toggling the docs side nav or the topic TOC SHALL update the corresponding `_open` class on the existing DOM elements — the side-nav and container elements SHALL keep their node identity, and no topic-content fetch SHALL occur.

#### Scenario: Side-nav toggle preserves node identity

- **WHEN** the user toggles the side nav open or closed
- **THEN** the side-nav element's `_open` class reflects the new state
- **AND** the element is the same DOM node as before the toggle

#### Scenario: TOC toggle preserves content and issues no fetch

- **WHEN** the user toggles the topic TOC
- **THEN** the container element's `_open` class reflects the new state
- **AND** the container is the same DOM node with the same topic content
- **AND** no topic-content request is issued

### Requirement: Toggle subscriptions are balanced across docs entries

The class-driving watch subscriptions SHALL be released when the docs layout unmounts and re-established when it remounts, so that after any number of docs entries and exits a single toggle produces exactly one class transition.

#### Scenario: No watcher stacking after repeated entries

- **WHEN** the user enters and leaves the docs section several times and then toggles the side nav or TOC once
- **THEN** the class flips exactly once (no flicker or repeated transitions)
- **AND** manual toggle state still persists across docs re-entries per `hook-setup-idempotence`
