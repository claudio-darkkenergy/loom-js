## ADDED Requirements

### Requirement: A template's dynamic wiring is computed once

For each template and document, the parsed fragment SHALL be normalized once — every slot token in a text or comment node split into its own text node, every special attribute removed from its element — and the dynamic paths resolved once into a plan: how to reach each dynamic node from a clone and which kind of update applies (text, attribute, event, `$attrs`, `$on`, `$props`, custom-element prop). Every instance of the template SHALL render through that plan. Rendering an instance SHALL classify no attribute, parse no attribute name, split no text and remove no attribute.

#### Scenario: Instances share one plan

- **WHEN** a component template renders 1 000 instances in one document
- **THEN** its plan is built once and each instance consults it

#### Scenario: Plans are per document

- **WHEN** the same template renders in two injected documents
- **THEN** each document holds its own plan next to its own parsed fragment

#### Scenario: Clones are already normalized

- **WHEN** an instance of a template with special attributes and slot tokens inside text is created
- **THEN** its clone carries no special attribute and no text node holding a slot token, and the wiring removes no attribute and splits no text

#### Scenario: Nodes are reached without child lists

- **WHEN** an instance resolves its dynamic nodes from its clone
- **THEN** no `childNodes` list is read; nodes are reached through `firstChild`/`nextSibling` steps

### Requirement: An instance holds slots, not closures

A rendered instance SHALL hold one slot per dynamic path — its live node, its last value and, only for kinds that need it, a small state record (a listener, a binding unsubscriber, a map for `$attrs`/`$on`, the owned text node) — and SHALL apply values through update functions shared by every instance. No function SHALL be allocated per dynamic path per instance.

#### Scenario: Slot count equals dynamic path count

- **WHEN** a component with N dynamic paths renders
- **THEN** its context holds exactly N slots, each referencing a node in its clone

#### Scenario: Observable attribute semantics are unchanged

- **WHEN** an instance applies a standard attribute, a `bind` value, an `$event`, `$attrs`, `$on`, `$props` or a style value through its slot
- **THEN** the element ends in the same state the pre-plan updaters produced, with one listener per event per element and one binding subscription per slot
