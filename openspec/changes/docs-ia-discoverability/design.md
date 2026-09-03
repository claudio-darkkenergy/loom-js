# Design — docs-ia-discoverability

## Context

Draft review (2026-08-31 → 09-02) repeatedly hit concepts without homes: the fragment nuances were corrected one edge at a time (compiled-example `<>`, top-level-interpolation rule, the rule stranded in Keys), and the functional-component story splits across a subsection titled by mechanism ("pass-through") and an example comment. The heading is the unit of discovery: TOC entries (`toc-sub-section-links` extends this to h3s), side-nav scanning, and future search all index headings.

## Goals / Non-Goals

**Goals:** every concept a reader might seek has a heading; fragment knowledge consolidated with pointers back; a recorded sweep so the pattern is hunted once, systematically, not re-discovered per review.

**Non-Goals:** renaming published slugs; restructuring for taste where discovery isn't improved; `readme-slim-down`'s anchor inversion (this change works within README parity); grouped-nav placement decisions (taken as input).

## Decisions

### D1 — Functional components: section now, topic only if it outgrows

Components h2 "Functional components" with h3s "Simple components" and "Plain functions", placed in the creating-arc (after the template-function material, before "Using components"). Two patterns and one contract don't fill a topic, and "how do I define a component" should stay one page; `toc-sub-section-links` makes the h3s navigable, which is the discoverability actually sought.

### D2 — Fragments: a real topic, scattered sites keep pointers

Learning-path position between `element-syntax` and `custom-elements` (grouping per the grouped-nav outcome). Owns: the `<>` token; root forms + lone-tag inference + the interpolation rule; `node()` and hook-handler arrays; keyed fragment reconciliation (core's `fragment-array-reconciliation` spec is the source); fragment values in children arrays/slots regions. Components and Element Syntax keep one-line pointers where the material used to live — local nuance, linked concept. Sourced from multiple README passages; the map records the many-to-one mapping (first deliberate exception to one-section-per-topic).

### D3 — The sweep is an artifact with verdicts

`sweep.md` in this change: per topic, candidate concepts found (prose-only names, mechanism-titled headings, split material), each with a verdict — restructure in this change / defer with rationale / fine as-is — maintainer-reviewed before content work, mirroring the map-review gate. Known candidates seeded: **element bindings** (the strongest: the `$` vocabulary — `$click`/`$event`, `$attrs`, `$on`, `$props` — has no heading anywhere _and_ a coverage gap: `$attrs`/`$on`/`$props` behavior is explained nowhere, `$event` surfaces only via Configuration's `appendEvents`, the rest lives in examples — likely a named Components or Element Syntax section, possibly closing the coverage gap in the same stroke); the settlement signal (named across five topics, defined in none — likely deserving a home or a glossary anchor); `el()` (element components section vs. value-position usage); reserved props (`document-component-refs` already covers); rich-text/authoring conventions (docs-internal, likely fine).

## Risks / Trade-offs

- [A fragments topic thins Element Syntax] → ES keeps the compile story and syntax rules; only fragment-generalities move; review the seam at outline time.
- [Sweep scope-creeps into a rewrite] → verdicts constrain: only discoverability failures qualify; taste restructures get "defer" verdicts.
- [Anchor churn from renamed headings] → sequenced post-publish, so changes are versioned content updates with the redirect-note convention the map already carries for renames.

## Migration Plan

After the gates: sweep → maintainer review → README + map restructure → topic drafts → standing draft-review → publish. Cross-links updated in the same pass.

## Open Questions

- Fragments slug (`fragments` presumed) and its group — settled at sweep review with the grouped-nav outcome in hand.
