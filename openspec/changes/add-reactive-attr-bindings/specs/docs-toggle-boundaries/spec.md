## MODIFIED Requirements

### Requirement: TOC toggles mutate a class without re-rendering content

Toggling the topic TOC SHALL update the `_open` class on the existing container element — the container SHALL keep its DOM node identity and its rendered topic content, and no topic-content fetch SHALL occur. The class SHALL be driven by a declarative attribute binding (`topicTocToggle.bind(...)`) rather than an imperative watch.

#### Scenario: TOC toggle preserves the container and issues no fetch

- **WHEN** the user toggles the topic TOC
- **THEN** the container element's `_open` class reflects the new state
- **AND** the container is the same DOM node with the same topic content
- **AND** no topic-content request is issued
