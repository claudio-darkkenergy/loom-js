# pink-tailwind-compatibility Specification

## Purpose

Defines how `@loom-js/pink` coexists with Tailwind CSS v4 in one app: the cascade order between pink and Tailwind's layers, how consumer classes compose with pink's, and the workspace example that proves the setup.

## Requirements

### Requirement: Pink orders itself between Tailwind's base and utilities

`dist/pink.css` SHALL open with a layer-order statement that places `pink` after Tailwind v4's `theme` and `base` layers and before its `components` and `utilities` layers. A consumer who imports `@loom-js/pink/pink.css` before `tailwindcss` SHALL need no further cascade configuration.

#### Scenario: Tailwind utilities override pink

- **WHEN** an app imports `pink.css` and then `tailwindcss`, and renders `PinkButton` with `className: 'bg-red-500'`
- **THEN** the button's computed background is Tailwind's red, not pink's button background

#### Scenario: preflight does not flatten pink

- **WHEN** the same app renders `PinkButton` with no Tailwind classes
- **THEN** its computed padding, border radius and background match the button rendered in an app without Tailwind

#### Scenario: no Tailwind in the app

- **WHEN** an app imports `pink.css` and no Tailwind stylesheet
- **THEN** the empty `theme`, `base`, `components` and `utilities` layers declared by the order statement carry no rules
- **AND** pink components render the same as before the change

### Requirement: Consumer classes compose with pink's classes

A pink component given `className` SHALL put those classes on its root element alongside the classes pink sets. Falsy entries SHALL be dropped, and no class SHALL be rewritten or deduplicated, so a Tailwind utility reaches the DOM exactly as written.

#### Scenario: utility classes reach the root

- **WHEN** `PinkTag` renders with `className: 'mt-4 uppercase'` and `isSuccess: true`
- **THEN** its root's class list contains `mt-4`, `uppercase`, `tag` and `is-success`

### Requirement: Known class-name collisions are documented

The pink docs SHALL list every pink class name that Tailwind v4 also generates as a utility (`container`, `list-item`, `table`, `table-row`), and SHALL show how a Tailwind consumer stops Tailwind from generating those utilities.

#### Scenario: collision guidance is present

- **WHEN** a reader opens the pink overview topic's Tailwind section
- **THEN** it names each colliding class and shows the Tailwind source directive that excludes it

### Requirement: A workspace example demonstrates pink with Tailwind

The workspace SHALL include a private example app that builds with `@loom-js/build`, imports pink and Tailwind v4 in the documented order, and renders pink components restyled with Tailwind utilities. The example SHALL build from a clean checkout with `pnpm build`.

#### Scenario: example builds and renders

- **WHEN** `pnpm -F @loom-js/example-pink-tailwind build` runs and the output is served
- **THEN** the page renders pink components with Tailwind utility overrides applied
- **AND** the browser console reports no errors
