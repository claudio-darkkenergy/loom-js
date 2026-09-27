# Docs IA Discoverability

## Why

The README-derived topics inherited the README's information architecture, and draft review kept surfacing the same failure shape: real concepts without a discoverable home. `simple` components hide under a "pass-through" heading; the plain-function component contract lives in an example comment; the fragment concept is scattered across four sites (root forms, `<>` inference, `node()` arrays, group reconciliation) and shed nuance bugs one at a time during review. Readers find what headings name — concepts that only exist _between_ headings are invisible to the TOC, the side nav, and search (maintainer direction, 2026-09-02).

## What Changes

- **Functional components** becomes a named Components section (h2) gathering `simple` and the plain-function pattern — promotion to a topic deferred until the section outgrows the page.
- **Fragments** becomes its own topic in the learning path (after Element Syntax, before Custom Elements): the `<>` token, root forms and inference, the top-level-interpolation rule, `node()`/hook arrays, keyed fragment reconciliation, fragment values in children arrays — with the current scattered sites keeping one-line pointers into it.
- **A discoverability sweep of all 13 topics** hunts more instances of the pattern — concepts named only in prose, buried under implementation-word headings, or split across sites — and records each verdict (restructure here, defer, or leave) in the sweep artifact this change produces.
- README follows per the standing parity machinery (new section heading; new topic sourced across existing README passages) while the README remains the anchor — this lands pre-`readme-slim-down`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `docs-information-architecture`: one-topic-per-README-concept loosens to admit concept topics justified by discoverability (fragments: sourced from multiple README passages); the topic list requirement gains the fragments entry.

## Impact

- Contentful — one new topic entry (`fragments`, slug review-gated), edits to `components`/`element-syntax` (+ whatever the sweep adds).
- `packages/core/README.md` + content map — restructured sections, new topic mapping, updated cross-links/anchors.
- `apps/loom` — none (nav and TOC derive).
- **Sequenced after** `align-loom-docs-with-core-readme` phase-4 publish (anchors/slugs are semi-permanent once live; don't reshape mid-publish) **and** the `docs-grouped-side-nav` grouping decision (the fragments topic should land in its group once). Subsumes the map's "Deferred restructures" note (2026-09-02).
