## Purpose

Defines the project's obligations for core's kit-agnostic element components — the element-level survivors of the `@loom-js/tags` retirement, shipped as tree-shakeable named exports of `@loom-js/core`: `RouteLink` (an anchor wired to the SPA router), the media components `Svg` and `Picture`, and the `el(tagName)` factory (a plain HTML tag as a memoized component value). These exist for element-level behavior that markup cannot express — self-wired routing, sprite/responsive composition, and element-as-value positions (`is=` polymorphism, third-party render callbacks, props transformers); plain structure is authored as template markup instead.

Spun out of `element-syntax-first` (its design Decisions 4–6); the pink/app conversion off `@loom-js/tags` builds on this capability.

## Requirements

### Requirement: RouteLink performs SPA routing without caller wiring

`@loom-js/core` SHALL export a tree-shakeable `RouteLink` component rendering an anchor whose activation performs SPA routing via the core router, with no caller-supplied `route` handler.

#### Scenario: internal link routes via the router

- **WHEN** a template composes `<${RouteLink} href="/docs">…</>` and the anchor is activated
- **THEN** navigation is handled by the core router (History API), not a full page load
- **AND** the children render inside the anchor

#### Scenario: non-SPA activations fall through to the browser

- **WHEN** the `RouteLink` has `target="_blank"` or an external-origin `href`
- **THEN** activation is left to the browser default and the router is not invoked

#### Scenario: no active-state affordance in v1

- **WHEN** the current location matches the link's `href`
- **THEN** `RouteLink` applies no automatic class or attribute — active-state is out of scope for v1

### Requirement: Core provides the media components

`@loom-js/core` SHALL export tree-shakeable `Svg` and `Picture` components; `Picture` SHALL absorb the responsive chooser, and `Source` markup SHALL be internal with its props exported as a type.

#### Scenario: Svg composes a sprite reference

- **WHEN** a template composes `<${Svg} path="/static/svg/sprite.svg" svgId="logo" size="20" />`
- **THEN** an `<svg>` with `fill="currentColor"` renders a `<use>` referencing `path#svgId`
- **AND** `size` sets both dimensions, with `height`/`width` as individual fallbacks

#### Scenario: Picture with sources renders a picture element

- **WHEN** `Picture` receives a non-empty `sources` array plus img props
- **THEN** a `<picture>` renders one `<source>` per entry followed by the `<img>`

#### Scenario: Picture without sources renders a bare img

- **WHEN** `Picture` receives no `sources` (absent or empty)
- **THEN** it renders the `<img>` alone, with no `<picture>` wrapper

### Requirement: el() supplies plain tags as component values

`@loom-js/core` SHALL export a memoized `el(tagName)` factory returning a component that renders the named plain HTML tag, for use anywhere element syntax needs an element as a value (`is=` props, render callbacks, props transformers).

#### Scenario: el() renders the named tag

- **WHEN** `el('footer')({ children })` is composed (functionally or as `<${el('footer')}>…</>`)
- **THEN** a `<footer>` element renders with the children inside
- **AND** `attrs`, `on`, and `onClick` props map to attributes and listeners; `className`, `id`, and `style` map to their attributes — the flat surface the tags wrappers exposed, so converted delegators pass the same shape to `el()` roots and not-yet-converted tags roots alike

#### Scenario: el() is memoized per tag name

- **WHEN** `el('footer')` is called twice
- **THEN** both calls return the same component reference
- **AND** re-renders of a template using it reuse the existing DOM nodes rather than recreating them

#### Scenario: void tags render childless

- **WHEN** `el('img')` or another void tag component renders
- **THEN** the element renders without a closing tag or children slot
