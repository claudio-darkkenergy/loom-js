## ADDED Requirements

### Requirement: Context functions are recognized by marker, not by name

Core SHALL recognize its component and activity context functions through the `contextFunctionKind` marker assigned at creation. No code path SHALL test `Function.name` as the primary check; the name fallback inside the kind resolver exists only for values produced by an older core copy.

#### Scenario: Minified build keeps keyed items

- **WHEN** an app is bundled with a minifier that renames functions (no `keepNames`) and a keyed array slot re-renders with the same keys
- **THEN** each keyed item reuses its DOM node and child context exactly as in an unminified build

#### Scenario: Every detection site agrees

- **WHEN** a context function reaches the array reconciler, the interpolation value diff, or the style-argument path
- **THEN** each site classifies it through the kind resolver and never through its name
