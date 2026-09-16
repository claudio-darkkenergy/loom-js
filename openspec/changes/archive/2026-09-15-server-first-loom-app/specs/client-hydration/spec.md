# client-hydration Specification (delta)

## MODIFIED Requirements

### Requirement: Hydrating boot defers takeover to a single atomic swap

The framework SHALL provide a client boot entry, `hydrate`, that leaves the root's pre-rendered children untouched while the app renders and settles off-DOM, then replaces the root's children exactly once with the rendered app. `hydrate` SHALL mirror `init`'s contract (`app`, `root`, `globalConfig`, `onAppMounted`) except that no append mode is offered — the swap is always a full replace. A root with no pre-rendered children SHALL instead mount immediately and render progressively, as `init` would — with nothing to preserve, the settle gate would only hold a blank screen where a loading state should paint.

#### Scenario: Pre-rendered content stays visible until the swap

- **WHEN** `hydrate({ app, root })` is called on a root containing server-rendered markup and the app includes content behind an async importer
- **THEN** the root's children are not modified before the app has settled
- **AND** after the swap the root contains the fully rendered app — settled route content, not the shell/fallback

#### Scenario: The swap is a single replacement

- **WHEN** the app settles and the swap runs
- **THEN** the root's children are replaced in one `replaceChildren`-equivalent operation, with no intermediate fallback state ever attached to the root

#### Scenario: Empty root mounts immediately

- **WHEN** `hydrate` is called on a root with no pre-rendered children
- **THEN** the app mounts right away and renders progressively — loading states paint while async work is pending, exactly as under `init`
