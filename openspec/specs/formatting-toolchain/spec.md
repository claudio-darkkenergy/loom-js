## Purpose

Defines the project's obligations around automated formatting — that prettier runs to completion across the whole repository, that the import-sorting plugin's parser is constrained independently of the compiler the repository builds with, that imports land in the documented order, that `.prettierrc` carries no options nothing honors, and that a broken formatter fails CI at the commit that breaks it.

## Requirements

### Requirement: Prettier runs successfully across the repository

Prettier SHALL complete without error on every file it is configured to handle, including TypeScript sources. A plugin failure SHALL NOT be an accepted condition of the repository.

#### Scenario: formatting a TypeScript source file

- **WHEN** prettier is run against any `.ts` file in the repository
- **THEN** it completes and reports formatting status
- **AND** it does not throw `TypeError: Cannot read properties of undefined (reading 'Latest')` or any other plugin error

#### Scenario: formatting the whole repository

- **WHEN** the repository-wide format check is run
- **THEN** it exits with a status reflecting formatting state alone
- **AND** no file is skipped because a plugin failed to load or parse it

### Requirement: The formatter's parser is decoupled from the repository's compiler

The import-sorting plugin parses source with the TypeScript API. The TypeScript it resolves for that purpose SHALL be constrained independently of the TypeScript the repository builds and type-checks with, so that a formatting tool never dictates the repository's compiler version.

#### Scenario: repository uses the latest TypeScript

- **WHEN** the repository's own TypeScript version is chosen
- **THEN** it is free to be the latest major
- **AND** no formatting tool constrains that choice

#### Scenario: the plugin resolves a TypeScript exposing the API it calls

- **WHEN** dependencies are installed from a clean state
- **THEN** the TypeScript resolved for the import-sorting plugin exposes the legacy compiler API it depends on (`ScriptTarget` and a text-parsing `createSourceFile`)
- **AND** this does not depend on automatic peer resolution happening to choose a compatible version

#### Scenario: reinstalling does not re-float the plugin's parser

- **WHEN** `node_modules` is removed and dependencies are reinstalled
- **THEN** the plugin resolves a compatible TypeScript again
- **AND** prettier still runs successfully afterward

#### Scenario: the constraint disappears if it stops being needed

- **WHEN** the import-sorting plugin no longer requires a pinned parser — because it gains support for the repository's TypeScript major, or is replaced by a plugin that does not use the TypeScript API
- **THEN** the pin is removed rather than retained
- **AND** formatting continues to satisfy every other requirement in this capability

### Requirement: Imports are sorted to the documented convention

Formatting SHALL order imports as NPM packages first, then local imports, separated by a blank line — the convention described in `CLAUDE.md`.

#### Scenario: mixed NPM and local imports

- **WHEN** a file containing both NPM-package and local imports is formatted
- **THEN** NPM-package imports appear first, local imports after
- **AND** the two groups are separated by exactly one blank line

### Requirement: Configuration contains only honored options

`.prettierrc` SHALL contain only options that prettier or a configured plugin actually applies. Options belonging to packages that are not installed SHALL be removed.

#### Scenario: running prettier produces no configuration warnings

- **WHEN** prettier is run on any file
- **THEN** it emits no `Ignored unknown option` warning
- **AND** the options that remain are those the installed plugin honors

### Requirement: Formatting is verified automatically

Formatting SHALL be checked by an automated job rather than by hand, so a regression surfaces at the commit that introduces it.

#### Scenario: a formatting check is available as a script

- **WHEN** a contributor runs the repository's format-check script
- **THEN** it reports whether the tree is correctly formatted
- **AND** it requires no plugin-bypassing flags or hand-written prettier invocations

#### Scenario: continuous integration runs the check

- **WHEN** changes are pushed or a pull request is opened
- **THEN** the format check runs in CI
- **AND** a broken formatter or an unformatted file fails the run
