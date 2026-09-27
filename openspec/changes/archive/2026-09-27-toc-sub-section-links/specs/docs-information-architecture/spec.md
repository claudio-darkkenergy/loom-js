## ADDED Requirements

### Requirement: The on-page TOC covers h2 and h3 sections

Every h2 and h3 heading in a rendered topic SHALL carry a stable anchor id — the shared kebab/punctuation-stripped convention, with GitHub-style occurrence suffixes making ids unique within the topic — and the on-page TOC SHALL list every h2 with its h3s nested beneath it, in document order, each entry linking to its heading's anchor.

#### Scenario: sub-sections are listed and nested

- **WHEN** a topic containing h2 sections with h3 sub-sections renders
- **THEN** the TOC shows each h2 entry with its h3s as an indented sub-list, in document order

#### Scenario: TOC links land on their headings

- **WHEN** the reader activates any TOC entry, h2 or h3
- **THEN** the page scrolls to that heading (same-page anchor navigation)

#### Scenario: duplicate heading text stays uniquely addressable

- **WHEN** two headings in one topic share the same text
- **THEN** the second receives an occurrence-suffixed id (`-1`, …), the TOC links each to its own heading, and the rendered ids match the TOC's hrefs exactly

#### Scenario: h4 and deeper stay out

- **WHEN** a topic contains h4 headings
- **THEN** they render without anchors and do not appear in the TOC
