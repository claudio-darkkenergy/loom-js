## MODIFIED Requirements

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
