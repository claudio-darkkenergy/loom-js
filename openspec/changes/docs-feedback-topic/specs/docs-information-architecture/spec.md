## MODIFIED Requirements

### Requirement: Side nav lists topics in learning-path order

The docs side nav SHALL list the content map's topics first, in the map's order (getting-started first, diagnostics last), SHALL mark the currently selected topic, and MAY list trailing utility topics (non-README topics such as `feedback`) after the mapped set.

#### Scenario: Ordered listing

- **WHEN** the docs page listing renders
- **THEN** the mapped topics appear first in the content map's order, each linking to its `/docs/<slug>` route, with any trailing utility topics after them

#### Scenario: Current topic indicated

- **WHEN** a topic route is active
- **THEN** that topic's side-nav entry carries the selected state and no other entry does

#### Scenario: Trailing topics join derived navigation

- **WHEN** a trailing utility topic is present in the listing
- **THEN** it resolves at `/docs/<slug>` and participates in the derived prev/next pagination like any listed topic
