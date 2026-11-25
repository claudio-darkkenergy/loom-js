## MODIFIED Requirements

### Requirement: The build emits a static docs search index

The build tool's `artifacts` hook SHALL write `/static/search/index.json` from the same Contentful listing and topic entries the pages render, so both the production build and `loom dev` serve it: one entry per listed topic lead (`anchor: ''`) and one per h2/h3 section, each carrying `slug`, `title`, `group`, `heading`, `anchor`, `level` and the section's plain-text prose (paragraphs, lists, quotes, table cells, inline code — fenced code blocks excluded). Section anchors SHALL equal the ids the rendered page gives those headings. The file SHALL never be authored or committed.

#### Scenario: Every listed topic is indexed

- **WHEN** the build completes
- **THEN** every slug in the docs listing — including trailing utility topics — has a lead entry in the index, in listing order

#### Scenario: Anchors resolve on the page

- **WHEN** any index entry with a non-empty anchor is taken to `/docs/<slug>#<anchor>`
- **THEN** the prerendered page contains a heading with exactly that id

#### Scenario: A bad index fails the build

- **WHEN** a listed topic has no lead entry, an entry has an empty heading, or two entries share a `(slug, anchor)`
- **THEN** the build fails and names the offending topic

#### Scenario: Not part of prerendered state

- **WHEN** any route's dehydrated state script is inspected
- **THEN** it holds no search index entry

#### Scenario: Search works in dev

- **WHEN** `pnpm dev` is running with Contentful credentials and the palette opens
- **THEN** `/static/search/index.json` is served from the dev build's content source, and a query lists results that route to their headings
