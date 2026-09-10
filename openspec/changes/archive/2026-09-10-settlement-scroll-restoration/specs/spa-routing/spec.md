## ADDED Requirements

### Requirement: Scroll restoration is settlement-exact

The router SHALL own scroll restoration for its window (`history.scrollRestoration = 'manual'`), capturing the entry's scroll offset into its history state as scrolling comes to rest (and at push-time exit), and replaying a saved offset after the settlement signal resolves (bounded) on reload and history traversal — so the restored position is computed against fully-rendered content. A URL fragment SHALL outrank a saved offset; an entry with no saved offset SHALL remain at the top. All other scrolls of the navigation contract are unchanged.

#### Scenario: reload returns to the exact position

- **WHEN** a user scrolls a client-rendered page and reloads
- **THEN** after tracked content settles, the viewport returns to the saved offset — not a clamped intermediate, not the top

#### Scenario: traversal restores like reload

- **WHEN** the user navigates away and returns via back/forward
- **THEN** the entry's saved offset replays after settlement, exactly

#### Scenario: no saved state stays at the top

- **WHEN** a fresh entry (no captured offset) boots without a fragment
- **THEN** the viewport stays at the boot position and no restoration scroll fires
