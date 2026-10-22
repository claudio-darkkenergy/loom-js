## ADDED Requirements

### Requirement: The site header offers a search trigger on every route

The loom app's header SHALL render a search button on every route — `icon-search`, `aria-label="Search docs"`, and a keyboard hint (`⌘K` on Apple platforms, `Ctrl K` elsewhere) resolved on the client after mount and hidden on mobile. Activating it SHALL open the docs search palette.

#### Scenario: Trigger opens the palette

- **WHEN** a visitor on `/`, `/benchmarks` or any `/docs/<slug>` activates the header's search button
- **THEN** the search palette opens with its input focused

#### Scenario: Hint matches the platform

- **WHEN** the page hydrates on macOS (or on Windows/Linux)
- **THEN** the hint reads `⌘K` (or `Ctrl K`), and the prerendered markup carried an empty hint so hydration finds no mismatch

### Requirement: Cmd/Ctrl+K toggles the palette from anywhere

A `Cmd+K` (Apple) or `Ctrl+K` keydown on the window SHALL open the palette when closed and close it when open, with the browser's default for that chord prevented. No other chord SHALL be bound.

#### Scenario: Shortcut opens

- **WHEN** the palette is closed and the reader presses Cmd/Ctrl+K anywhere on the page
- **THEN** the palette opens, the input is focused, and the browser's own Ctrl+K behavior does not fire

#### Scenario: Shortcut and Escape close

- **WHEN** the palette is open and the reader presses Cmd/Ctrl+K, or Escape
- **THEN** the palette closes and focus returns to the element that had it

#### Scenario: Shift variant is unbound

- **WHEN** the reader presses Cmd/Ctrl+Shift+K
- **THEN** nothing in the app responds

### Requirement: The build emits a static docs search index

The production build SHALL write `/static/search/index.json` in the prerender `after` phase from the same Contentful listing and topic entries the pages render: one entry per listed topic lead (`anchor: ''`) and one per h2/h3 section, each carrying `slug`, `title`, `group`, `heading`, `anchor`, `level` and the section's plain-text prose (paragraphs, lists, quotes, table cells, inline code — fenced code blocks excluded). Section anchors SHALL equal the ids the rendered page gives those headings. The file SHALL never be authored or committed.

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

### Requirement: Search code and data load only on first open

The palette module, the ranker and the index SHALL load only when the palette first opens — through core's `lazyImport` and a keyed resource — and never during prerender. No route's initial JavaScript SHALL contain them.

#### Scenario: Initial bundles are untouched

- **WHEN** the production build completes
- **THEN** the search palette and ranker live in a chunk no route shell preloads, and `/static/search/index.json` is not requested until the palette opens

#### Scenario: Reopen is instant

- **WHEN** the reader opens the palette a second time in the same page session
- **THEN** no further import or index request is made

#### Scenario: Index fetch fails

- **WHEN** the index request fails or returns non-JSON
- **THEN** the palette shows an unavailable message and the rest of the page is unaffected

### Requirement: Results rank by title, heading, then text, and follow listing order on ties

Typing in the palette SHALL rank index entries where every query token prefix-matches a word in the title, heading or text: title hits weigh 3 on a topic's lead entry and 1 on its section entries (so a query naming the topic lands on the topic, not a section), heading hits 2, text hits 1, a contiguous whole-query match adds a bonus, and ties keep listing order. The palette SHALL show at most eight results as `topic title › heading` with a snippet around the first text hit, and a no-results line when none match.

#### Scenario: Heading beats body

- **WHEN** the query is `lazy import` and one entry has it in the heading while another only in its text
- **THEN** the heading entry ranks first

#### Scenario: All tokens required

- **WHEN** the query is `keyed lists` and an entry contains `keyed` but no word starting with `lists`
- **THEN** that entry is not a result

#### Scenario: Empty query

- **WHEN** the input is empty
- **THEN** no results and no "no results" line render

### Requirement: Selecting a result navigates client-side to the heading

↑/↓ SHALL move the active result (wrapping, with `aria-activedescendant` on the input); Enter or a click SHALL close the palette and route to `/docs/<slug>` (lead) or `/docs/<slug>#<anchor>` (section) through the SPA router, so the existing hash scroll lands on the heading.

#### Scenario: Keyboard selection

- **WHEN** the reader presses ↓ twice then Enter
- **THEN** the third result's topic renders without a page load, scrolled to its heading, and the palette is closed

#### Scenario: Click selection

- **WHEN** the reader clicks a result
- **THEN** the same navigation occurs as for Enter
