# attr-value-semantics — delta

## ADDED Requirements

### Requirement: Style values apply by replacement

A `style` attribute whose resolved template value is an object or an array SHALL fully determine the element's inline style on each application: the previous inline style SHALL be cleared before the resolved properties are applied. A resolved value that yields zero properties (an empty object/array, or one whose property values are all nullish) SHALL leave the `style` attribute absent — the template placeholder token SHALL NOT serialize into the DOM under any resolved value. This rule SHALL hold identically in the template attr-slot path and the `$attrs` entry path. Within a single array value, entries (strings, objects, thunks, nested arrays) SHALL continue to merge into one another in order.

#### Scenario: empty-resolving style removes the attribute

- **WHEN** a `style` slot's resolved value is an object or array yielding zero properties (e.g. `{}`, `[]`, `{ '--x': undefined }`, `[{ '--x': undefined }, undefined]`)
- **THEN** the element has no `style` attribute, and the placeholder token does not appear in the serialized markup

#### Scenario: re-render drops a property

- **WHEN** a `style` slot renders with `{ color: 'red', margin: '4px' }` and then re-renders with `{ color: 'blue' }`
- **THEN** the inline style contains only `color: blue` — the dropped `margin` is no longer applied

#### Scenario: $attrs style entry replaces identically

- **WHEN** a `$attrs` object carries a `style` entry that re-applies with a value dropping a previously applied property, or with a value yielding zero properties
- **THEN** the dropped property is removed, and the zero-property value leaves the `style` attribute absent

#### Scenario: array entries still merge within one application

- **WHEN** a `style` slot's resolved value is `['color: red;', { margin: '4px' }]`
- **THEN** the inline style contains both `color: red` and `margin: 4px`
