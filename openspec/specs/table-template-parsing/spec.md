## Purpose

Defines the project's obligations for parsing and rendering component templates that contain HTML table markup. Body-context parsing strips table-part roots and foster-parents interpolated nodes out of tables; this capability guarantees table-part-rooted templates keep their authored root, interpolations inside table content render in place, table-free templates keep the pre-existing parse path byte-for-byte, and browser and injected-DOM (linkedom) renders agree on table markup.

Introduced by the `table-aware-template-parsing` change; heals `el('tr')`/`el('td')`-style components, dynamic row lists, and Contentful rich-text tables.

## Requirements

### Requirement: Table-part-rooted templates keep their authored root

A component template whose top-level element is a table-part tag (`tr`, `td`, `th`, `thead`,
`tbody`, `tfoot`, `caption`, `colgroup`, `col`) SHALL parse to that element as the template
root — never to a stripped or text-only fragment.

#### Scenario: tr-rooted template

- **WHEN** a component template of the form `<tr><td>${value}</td></tr>` renders
- **THEN** the component's root node is a `<tr>` element containing the authored `<td>` and
  its resolved value

#### Scenario: Section-rooted template

- **WHEN** a component template rooted at `<thead>`, `<tbody>`, `<tfoot>`, or `<colgroup>`
  renders
- **THEN** the root is that element with its authored children intact

### Requirement: Interpolations inside table content stay in place

A node-position interpolation directly inside `table`, `thead`/`tbody`/`tfoot`, `tr`, or
`colgroup` content SHALL render its resolved value at the authored position — never
foster-parented outside the table.

#### Scenario: Dynamic row list

- **WHEN** a template interpolates an array of row components directly inside `<tbody>` (or
  `el('table')` receives table-section children)
- **THEN** the resolved rows render inside that section, and the document contains no leaked
  nodes preceding the table

#### Scenario: Row and cell updates re-render in place

- **WHEN** the interpolated row list updates (rows added, removed, or reordered)
- **THEN** the rows reconcile inside their section exactly as list slots do outside tables

#### Scenario: Tokens in text-allowing table positions are unaffected

- **WHEN** an interpolation sits inside `td`, `th`, or `caption` content, or in an attribute
  value on any table-part tag (e.g. `<tr class=${cls}>`)
- **THEN** it resolves through the existing text/attribute slot machinery unchanged

### Requirement: Non-table templates keep the existing parse path

Templates containing no table-part tags SHALL parse exactly as before this change — same
mechanism, same cached fragment content, same paths.

#### Scenario: Non-table template unaffected

- **WHEN** a template with no table-part tags is parsed
- **THEN** its parse output and dynamic-path set are identical to the pre-change behavior

### Requirement: Browser and injected-DOM renders agree on table templates

Rendering a table template in the browser and via `renderToString` against an injected
(linkedom) window SHALL produce the same markup.

#### Scenario: Server render parity

- **WHEN** the same table-bearing app renders in Chromium and through `renderToString` with a
  linkedom window
- **THEN** the serialized table markup matches the browser's rendered structure
