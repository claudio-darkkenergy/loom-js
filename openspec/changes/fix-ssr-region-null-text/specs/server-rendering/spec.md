## ADDED Requirements

### Requirement: Compiled regions serialize without artifacts

Component-element regions — the children region and each provided named-slot region — SHALL serialize under `renderToString` byte-identical to the browser's rendering of the same template: region content in place, no artifact text nodes, and absent regions rendering nothing.

#### Scenario: children region serializes clean

- **WHEN** a template composes a component element with markup children and renders via `renderToString`
- **THEN** the serialized children match the browser render exactly, with no leading or trailing artifact text

#### Scenario: named-slot regions serialize clean

- **WHEN** a component element supplies labelled slot content and the component interpolates its regions
- **THEN** each provided region serializes its content exactly as the browser renders it, and an absent region serializes nothing
