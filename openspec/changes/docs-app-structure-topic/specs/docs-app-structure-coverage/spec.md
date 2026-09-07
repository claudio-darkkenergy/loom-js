## ADDED Requirements

### Requirement: The app-structure topic documents the reference anatomy

The docs SHALL expose an app-structure topic covering a loom app's module roles (shared component tree, browser-only entry, server modules), their import arrows and scope rules, the shell and asset conventions, and an annotated directory tree — accurate to the reference app's shipped structure per the reviewed outline.

#### Scenario: the topic resolves and matches the outline

- **WHEN** a reader opens the app-structure topic after this change lands
- **THEN** it renders the outlined anatomy, including the import-arrow discipline and the annotated tree

#### Scenario: structural changes prompt a docs touch

- **WHEN** a change alters the reference app's consumer-relevant structure (entry, module roles, aliases, shell conventions)
- **THEN** the topic is updated or a follow-up recorded — drift is never silent
