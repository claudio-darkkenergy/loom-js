## MODIFIED Requirements

### Requirement: Side nav lists topics in learning-path order

The docs side nav SHALL present the core content map's topics in the map's order, partitioned contiguously into named concept groups rendered as collapsible sections, followed by the pink content map's topics as one further group; the group containing the active topic SHALL render open (including in server-rendered markup), the selected topic SHALL be marked, and trailing utility topics (non-README topics such as `feedback`) SHALL appear within the final core group after the mapped set. Flattening the groups' children SHALL reproduce the core map's exact order followed by the pink map's exact order.

#### Scenario: Grouped, ordered listing

- **WHEN** the docs page listing renders
- **THEN** group sections appear in map order, each listing its topics in map order, and flattening the groups yields the core map's topic sequence followed by the pink map's

#### Scenario: Active group open

- **WHEN** a topic route is active
- **THEN** that topic's group renders open with the topic's entry marked selected, and no other entry is marked

#### Scenario: Collapsed groups toggle

- **WHEN** the reader activates a collapsed group's header
- **THEN** the group opens (and can collapse again) without navigation or page reload

#### Scenario: Derived navigation follows the flat order

- **WHEN** prev/next pagination renders for any topic
- **THEN** it follows the flattened listing order, crossing group boundaries — including the boundary between the last core group and the pink group — as if the listing were flat
