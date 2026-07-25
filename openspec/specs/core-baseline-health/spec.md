## ADDED Requirements

### Requirement: Core package type-checks cleanly

`pnpm -F @loom-js/core type-check` SHALL complete with zero TypeScript errors. Source modules SHALL NOT import types or exports that do not exist, and SHALL NOT retain orphaned modules that fail to compile.

#### Scenario: type-check reports no errors

- **WHEN** `pnpm -F @loom-js/core type-check` is run
- **THEN** it exits successfully with zero reported TypeScript errors

#### Scenario: no orphaned module with broken imports

- **WHEN** the core source tree is compiled
- **THEN** no module imports a nonexistent type (e.g. `SimpleTemplateFunction`)
- **AND** any module that is neither exported nor used has been removed rather than left broken

### Requirement: Test suite loads without stale imports

Every `packages/core/tests/**/*.spec.ts` file SHALL import only symbols that exist, so that `pnpm -F @loom-js/core test-ci` loads all spec modules and runs their tests. Tests SHALL NOT reference removed exports.

#### Scenario: all spec modules load

- **WHEN** `pnpm -F @loom-js/core test-ci` runs
- **THEN** every spec file imports successfully (no "does not provide an export named ..." errors)
- **AND** the routing spec runs its remaining tests instead of failing to load

#### Scenario: test project type-checks with test-runner globals

- **WHEN** the test project (`tests/tsconfig.json`, run via `pnpm -F @loom-js/core type-check-tests`) is type-checked
- **THEN** test-runner globals such as `describe` and `it` resolve (mocha types are in scope)
- **AND** the type-check reports zero errors across `tests/**`

### Requirement: No leftover debug logging in core source

Core source modules SHALL NOT contain leftover debug `console.log` statements introduced during development.

#### Scenario: register-custom-element has no debug log

- **WHEN** a component custom element is instantiated
- **THEN** no debug `console.log` (e.g. `{ _children, _scope, ... }`) is emitted
