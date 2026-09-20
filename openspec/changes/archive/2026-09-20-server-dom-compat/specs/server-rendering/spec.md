## ADDED Requirements

### Requirement: Server rendering works under spec-strict DOM implementations

`renderToString` SHALL produce correct output under spec-faithful DOM implementations beyond linkedom — verified against jsdom and Happy DOM — issuing no DOM calls that rely on lenient validation (empty attribute names included), on shared class realms across windows, or on a process-wide first document: templates parse per document, so any number of windows — of one implementation or several — may render in one process.

#### Scenario: the render matrix passes

- **WHEN** the server render tests run against linkedom, jsdom, and Happy DOM windows
- **THEN** each produces the expected markup, custom-element upgrades included

#### Scenario: no empty-name attribute calls

- **WHEN** a template with custom elements and `$`-prefixed interpolated props renders under a strict implementation
- **THEN** no `setAttribute` call carries an empty name and no `InvalidCharacterError` is thrown

#### Scenario: sequential windows render fully

- **WHEN** the same app renders into two windows of the same implementation, one after the other, in one process
- **THEN** both renders produce complete markup — dynamic slots filled and custom elements upgraded — with no placeholder artifacts in the second

#### Scenario: mixed implementations in one process

- **WHEN** renders against windows from two different DOM implementations interleave in one process
- **THEN** each render's templates parse against its own document and both produce correct markup

#### Scenario: the url option is implementation-independent

- **WHEN** a render passes `url` with a window whose `location` cannot be replaced (spec-unforgeable, e.g. jsdom)
- **THEN** loom's routing APIs (`locationEffect`, `watchRoute`, route matching) resolve the `url`-derived location

## MODIFIED Requirements

### Requirement: Render a loom app to an HTML string outside a browser

The framework SHALL provide two server render entries that render a loom app against an injected DOM provider and produce serialized HTML, without requiring a live browser: `renderToString` (async — the go-to; awaits the settlement signal so framework-tracked async work serializes before the markup is captured) and `renderToStringSync` (the synchronous primitive; serializes only what settled during the app's synchronous work).

#### Scenario: renderToString resolves markup

- **WHEN** `await renderToString(App(props), { window })` is called with a linkedom-backed `window`
- **THEN** it resolves a string containing the app's rendered HTML
- **AND** it does not access browser globals directly (only the injected provider)

#### Scenario: renderToStringSync returns markup synchronously

- **WHEN** `renderToStringSync(App(props), { window })` is called
- **THEN** it synchronously returns the markup that settled during the app's synchronous work

#### Scenario: Injected window is normalized

- **WHEN** the injected `window` lacks `NodeFilter` or `history`, or a `url` option is passed
- **THEN** the render entries install working stand-ins before rendering (`NodeFilter` constants, a minimal `history` shim) and register the `url`-derived `location`-like with the provider seam — installed onto the window where the implementation permits, and resolvable by loom's routing either way
