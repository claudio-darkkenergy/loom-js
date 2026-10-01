## ADDED Requirements

### Requirement: Scrolling keeps the URL fragment current

As the reader scrolls a topic in either direction, the URL fragment SHALL track the section currently in view, updated via `history.replaceState` — creating no history entries, emitting no navigation, and triggering no scroll. Scrolled above the first anchored heading, the fragment SHALL clear. During programmatic scrolls (router-deferred scrolls, TOC-initiated smooth scrolls) the spy SHALL hold until the scroll settles.

#### Scenario: scrolling down and up retitles the URL

- **WHEN** the reader scrolls a heading's section into the active region, downward or upward
- **THEN** the URL fragment becomes that heading's id, replacing (not pushing) history state

#### Scenario: above the content, no fragment

- **WHEN** the reader scrolls above the first anchored heading
- **THEN** the URL carries no fragment

#### Scenario: programmatic scrolls don't thrash the hash

- **WHEN** a hash navigation's smooth scroll passes intermediate sections
- **THEN** the fragment remains the destination's throughout the travel

### Requirement: The TOC indicator derives from the URL fragment

The on-page TOC SHALL mark exactly the entry matching the current URL fragment (with `aria-current`), regardless of how the fragment arrived — initial load, reload, history traversal, a TOC activation, a heading copy-link activation (including `scroll: false`, where the viewport does not move), or the scroll-spy. With no fragment, no entry is marked.

#### Scenario: every hash source moves the indicator

- **WHEN** the fragment changes by any means (load, traversal, click, copy-link, scroll)
- **THEN** the TOC marks the matching entry and unmarks the rest

#### Scenario: copy-link updates the indicator without scrolling

- **WHEN** the reader activates a heading's copy-link (`scroll: false`)
- **THEN** the viewport stays put and the TOC indicator moves to that heading's entry

### Requirement: Fragment sync is browser-only reflection

The behavior SHALL attach on mount and detach on unmount, perform no work off-browser (prerendered markup carries no indicator state beyond what the URL implies), and never invoke the router or any scroll.

#### Scenario: inert under prerender

- **WHEN** a topic renders via `renderToString`
- **THEN** the sync module observes nothing and the serialized markup matches the browser's pre-scroll initial render
