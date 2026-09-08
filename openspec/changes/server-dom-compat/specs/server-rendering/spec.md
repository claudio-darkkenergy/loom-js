## ADDED Requirements

### Requirement: Server rendering works under spec-strict DOM implementations

`renderToString` SHALL produce correct output under spec-faithful DOM implementations beyond linkedom — verified against jsdom and Happy DOM — issuing no DOM calls that rely on lenient validation (empty attribute names included). One DOM implementation per process remains the documented contract for template caching.

#### Scenario: the render matrix passes

- **WHEN** the server render tests run against linkedom, jsdom, and Happy DOM windows
- **THEN** each produces the expected markup, custom-element upgrades included

#### Scenario: no empty-name attribute calls

- **WHEN** a template with custom elements and `$`-prefixed interpolated props renders under a strict implementation
- **THEN** no `setAttribute` call carries an empty name and no `InvalidCharacterError` is thrown
