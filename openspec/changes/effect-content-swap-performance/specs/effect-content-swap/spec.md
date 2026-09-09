## ADDED Requirements

### Requirement: Unrelated content swaps replace wholesale

When an effect re-render delivers content whose top-level template identity differs from the incumbent's, the framework SHALL tear down the incumbent and build the incoming content fresh — it SHALL NOT reconcile attribute- or node-level state across the two trees. Same-template re-renders SHALL keep the existing micro-update behavior unchanged. Swap cost SHALL be proportional to the trees involved (teardown-plus-build class), not a cross-tree walk.

#### Scenario: different templates swap without cross-tree patching

- **WHEN** an effect slot holding a large rendered tree receives content from a different template
- **THEN** the incumbent unmounts (teardown observed), the incoming tree builds fresh, and no incumbent node survives into the new content

#### Scenario: same-template updates stay micro

- **WHEN** an effect re-renders content from the same template with different values
- **THEN** the existing node/attribute micro-update path runs, and unchanged nodes are preserved

#### Scenario: swap cost tracks teardown-plus-build

- **WHEN** the perf guard swaps two generated large unrelated trees in one slot
- **THEN** the swap completes within the guard's multiple of the same run's clear-then-build baseline
