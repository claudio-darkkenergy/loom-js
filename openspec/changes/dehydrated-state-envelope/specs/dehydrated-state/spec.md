## MODIFIED Requirements

### Requirement: Embeddable serialization is script-safe

The framework's server entry SHALL provide a serialize helper producing a JSON string safe to inline inside an HTML script element: sequences that could terminate the element or break parsing (`<`, U+2028, U+2029) SHALL be escaped, and the output SHALL parse back with `JSON.parse` to a versioned envelope (`__loom` format version plus the state) carrying the original state exactly.

#### Scenario: Script-breaking content is neutralized

- **WHEN** a dehydrated value contains `</script>` or paragraph/line separator characters and the helper serializes the state
- **THEN** the output contains no unescaped `<` and `JSON.parse` of it reproduces the envelope with the original state exactly

## ADDED Requirements

### Requirement: Priming validates the envelope and degrades unprimed

`primeResources` SHALL prime only payloads carrying a recognized envelope version. A payload without the envelope, or with an unrecognized version, SHALL prime nothing, SHALL emit one console warning naming the problem and the remedy, and SHALL leave the boot to proceed unprimed (all keys fetch normally). This is misuse detection, not a security boundary — the docs SHALL state that the serialize-time escaping remains the XSS defense.

#### Scenario: a hand-rolled payload does not prime

- **WHEN** `primeResources` receives a bare object produced by hand-rolled `JSON.stringify`
- **THEN** no keys are primed, one warning points at `serializeState`, and subsequent resource calls fetch as if unprimed

#### Scenario: an unknown future version degrades safely

- **WHEN** `primeResources` receives an envelope with a version it does not recognize
- **THEN** no keys are primed and one warning names the version mismatch, and the app boots correctly via normal fetching

#### Scenario: the helper's own output round-trips

- **WHEN** state serialized by the helper is parsed and passed to `primeResources`
- **THEN** every key primes exactly as before this change
