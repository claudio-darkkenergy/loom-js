## ADDED Requirements

### Requirement: Opt-in event replay honors pre-swap interactions

When `hydrate` is called with `replayEvents` enabled, events of the chosen types (default `click` & `submit`) landing on the served markup during the settle window SHALL be recorded and re-dispatched in order to the structurally corresponding client-tree nodes after the swap and lifecycle sweep, before `onAppMounted`. Native anchor navigation SHALL remain untouched. A target path that does not resolve in the client tree SHALL drop that event with a console warning. With `replayEvents` off (the default), behavior SHALL be unchanged and the replay code SHALL remain tree-shakeable out of non-hydrating bundles.

#### Scenario: an early click is honored

- **WHEN** a user clicks a `$click`-bound button in the served markup before the swap, with replay enabled
- **THEN** the handler fires exactly once after the swap, against the mounted client node, before `onAppMounted`

#### Scenario: anchors keep native navigation

- **WHEN** a user clicks a real anchor pre-swap with replay enabled
- **THEN** the browser navigates natively — the click is neither prevented nor replayed

#### Scenario: an unresolvable target is dropped loudly

- **WHEN** a recorded event's index path fails to resolve post-swap (e.g. a `maxWait`-expired swap left the region unrendered)
- **THEN** the event is not dispatched and a `loom.console` warning names the dropped event and path

#### Scenario: off by default, free when off

- **WHEN** `hydrate` runs without `replayEvents` (or an app uses only `init`)
- **THEN** no capture listeners attach, and the replay module is absent from an `init`-only bundle
