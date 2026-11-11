# Spec Delta

## MODIFIED Requirements

### Requirement: A template's dynamic wiring is computed once

For each template and document, the parsed fragment SHALL be normalized once — every slot token in a text or comment node split into its own text node, every dynamic attribute removed from its element — and the dynamic paths resolved once into a plan: how to reach each dynamic node from a clone, which kind of update applies (text, attribute, event, `$attrs`, `$on`, `$props`, custom-element prop) and, for an attribute, its name as authored in the template. Every instance of the template SHALL render through that plan. Rendering an instance SHALL classify no attribute, parse no attribute name, split no text and remove no attribute. No attribute SHALL be parsed or cloned with the slot placeholder as its value.

#### Scenario: Instances share one plan

- **WHEN** a component template renders 1 000 instances in one document
- **THEN** its plan is built once and each instance consults it

#### Scenario: Plans are per document

- **WHEN** the same template renders in two injected documents
- **THEN** each document holds its own plan next to its own parsed fragment

#### Scenario: Clones are already normalized

- **WHEN** an instance of a template with dynamic attributes and slot tokens inside text is created
- **THEN** its clone carries no dynamic attribute and no text node holding a slot token, and the wiring removes no attribute and splits no text

#### Scenario: Nodes are reached without child lists

- **WHEN** an instance resolves its dynamic nodes from its clone
- **THEN** no `childNodes` list is read; nodes are reached through `firstChild`/`nextSibling` steps

#### Scenario: SVG attributes never hold the placeholder

- **WHEN** a template binds SVG attributes with value grammars (`x`, `width`, `d`, `viewBox`) and renders several instances
- **THEN** the browser reports no attribute parse error, and each attribute carries its value under its authored name, `viewBox` included
