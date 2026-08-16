# attr-value-semantics Specification

## Purpose

Defines how resolved template tag values map to attribute presence/absence on plain elements, and how falsy values render in text slots. The load-bearing rule — falsy values remove the attribute, giving boolean attributes (`disabled=${false}`) and conditional attributes for free — carves out exactly one exemption: the number `0` is a real value everywhere.

Established by the `docs-readiness` change (2026-08-16); no earlier spec owned this behavior.

## Requirements

### Requirement: Falsy attribute values remove the attribute, except zero

An attribute whose resolved template value is falsy SHALL be removed from the element — supporting boolean attributes (`disabled={false}`) and conditional attributes (`undefined`/`null`/`''`) — EXCEPT the number `0`, which SHALL be applied like any truthy value. This rule SHALL hold identically in every attribute-setting path: template attr slots and `$attrs` entries.

#### Scenario: zero renders as an attribute value

- **WHEN** a template sets an attribute slot to the number `0` (e.g. `tabindex={0}`, `min={0}`)
- **THEN** the attribute is present on the element with the value `"0"`

#### Scenario: zero reaches the value-prop special case

- **WHEN** a template sets `value={0}` on a form element
- **THEN** the element's `value` property is set to `0` rather than the attribute being removed

#### Scenario: zero in a $attrs entry renders

- **WHEN** a `$attrs` object carries an entry whose resolved value is `0`
- **THEN** that attribute is present on the element with the value `"0"`

#### Scenario: other falsy values still remove the attribute

- **WHEN** an attribute's resolved value is `false`, `null`, `undefined`, `''`, or `NaN`
- **THEN** the attribute is removed from the element (absent boolean attributes stay absent)

### Requirement: Text interpolation preserves zero

A text slot whose resolved value is the number `0` SHALL render the text `"0"`, while other falsy values SHALL render as empty text.

#### Scenario: zero renders in text position

- **WHEN** a template interpolates the number `0` into a text slot
- **THEN** the live text node's content is `"0"`

#### Scenario: nullish values render empty text

- **WHEN** a template interpolates `undefined`, `null`, or `false` into a text slot
- **THEN** the live text node's content is the empty string
