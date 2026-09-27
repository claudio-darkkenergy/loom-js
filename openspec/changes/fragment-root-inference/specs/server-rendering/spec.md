## ADDED Requirements

### Requirement: Fragment-rooted templates serialize without artifacts

A fragment-rooted template SHALL serialize to the same markup under every verified DOM implementation (linkedom, jsdom, Happy DOM), containing only its authored nodes — no token, placeholder, or escaped artifact from the root classification.

#### Scenario: whitespace-led fragment under linkedom

- **WHEN** a component whose template opens with whitespace followed by several top-level elements is rendered with `renderToString` against a linkedom window
- **THEN** the output contains exactly the authored elements, and the same template rendered against jsdom and Happy DOM produces identical markup (whitespace-normalized)
