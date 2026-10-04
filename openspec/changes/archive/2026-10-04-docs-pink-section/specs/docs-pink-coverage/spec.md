## ADDED Requirements

### Requirement: Pink has a documented home on the docs site

The docs site SHALL expose a pink section — an overview topic covering what `@loom-js/pink` is, its upstream and core relationships, installation, and theming entry points, plus reference topics per the reviewed pink content map — reachable from the docs navigation.

#### Scenario: overview orients a new consumer

- **WHEN** a reader opens the pink overview topic
- **THEN** it states pink's purpose and layering, shows install/inclusion, and points into Storybook for the live catalog

#### Scenario: reference topics match the map

- **WHEN** the pink section's topics render
- **THEN** their set and outlines match the maintainer-reviewed pink content map

### Requirement: Pink docs track the shipped package

The pink content map SHALL record each topic's source pointers (package modules, stories), and a change altering pink's consumer-visible surface SHALL update the affected topics (or record a docs follow-up) — pink↔docs drift is never silent.

#### Scenario: pink changes prompt a docs touch

- **WHEN** a pink change alters a documented component's props, classes, or behavior
- **THEN** the change updates the corresponding topic or records the follow-up
