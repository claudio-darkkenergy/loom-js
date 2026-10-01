## ADDED Requirements

### Requirement: Consecutive tab-directive code blocks render as one tabbed panel

A run of consecutive sole-code paragraphs whose directives carry a tab label (`// @tab <label> [<group>]` following `// @lang <lang>`) SHALL render as a single code panel with one tab per block, the first tab active by default. Blocks without a tab directive SHALL render exactly as today, and a lone tab-directive block SHALL render as a plain panel.

#### Scenario: install variants merge

- **WHEN** three consecutive bash blocks carry `@tab npm`, `@tab yarn`, `@tab pnpm`
- **THEN** one panel renders with three tabs, npm's content visible, and the other variants hidden until selected

#### Scenario: untabbed content unaffected

- **WHEN** a topic contains only directive-less or `@lang`-only code blocks
- **THEN** panels render byte-identically to the pre-tabs behavior

### Requirement: The active tab owns the panel's content and copy

Selecting a tab SHALL swap the panel's rendered code to that variant in place and SHALL make the copy control copy exactly the active variant's source.

#### Scenario: copy follows selection

- **WHEN** the reader selects the pnpm tab and activates copy
- **THEN** the clipboard receives only the pnpm variant's code

### Requirement: Grouped tabs sync their selection

Tab runs sharing a group key SHALL share one selection: selecting a label in one panel SHALL select the same label in every panel of that group on the page. Ungrouped tab runs SHALL keep independent selections.

#### Scenario: one choice, every panel

- **WHEN** two grouped install panels render and the reader picks `pnpm` in the first
- **THEN** the second panel shows its `pnpm` variant without being touched

### Requirement: Tabbed panels prerender their default variant

Under `renderToString`, a tabbed panel SHALL serialize with the default (first) tab's content and markup identical to the browser's initial render, so hydration performs no correction.

#### Scenario: server/client parity

- **WHEN** the same tabbed panel renders on the server and in the browser before any interaction
- **THEN** the serialized markup is identical
