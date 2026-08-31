# Design — collapse-template-whitespace

## Context

Template statics are parsed once per call site and cached (`packages/core/src/lib/templating/`, chunks-array identity); dynamic values fill slots between static chunks. Today static text is preserved verbatim, HTML-style. JSX strips whitespace-only lines; Vue 3 condenses newline-containing whitespace-only nodes away — both therefore need an escape hatch (`{' '}`) to keep a space between content items formatted across lines. The maintainer's requirements: collapse by default (no opt-in), and **no escape hatch at all**.

## Goals / Non-Goals

**Goals:**

- Formatting whitespace never renders and never lands in the DOM; authored spacing always survives.
- Visual parity with today's output under `white-space: normal`.
- Zero per-render cost; identical server and client output.
- No authoring escape hatch: every spacing intent expressible as plain formatting.

**Non-Goals:**

- CSS awareness (a `pre-wrap`-styled non-`pre` element can't be detected statically — the rule makes its _formatting_ whitespace collapse, which is the desired outcome for the known cases).
- Attribute-value whitespace (unchanged; `attr-value-semantics` owns those).
- Trimming interpolated strings (values are content, always).
- A per-template or global option. One semantic.

## Decisions

### D1 — The newline rule: cross-line whitespace is formatting; same-line whitespace is content

A static whitespace run containing `\n` collapses; a run without `\n` is untouched. This is the discriminator JSX and Vue also use — indentation and line breaks always contain a newline; a deliberate space (`Hello <b>world</b>`, `<span> ${a}</span>`) never does.
_Alternative considered:_ trimming all boundary whitespace regardless of newlines — rejected: it breaks same-line authored spacing (`Hello <b>world</b>` → "Helloworld" is exactly the classic framework bug).

### D2 — Collapse to a single space between content; to nothing at child-list boundaries — this is what kills the escape hatch

Where JSX/Vue _remove_ a cross-line run between two content items (forcing `{' '}`), loom collapses it to **one space** — which is precisely what the browser renders for that run under `white-space: normal`. At the start and end of an element's child list the browser renders nothing, so the run is removed there. The transform therefore reproduces CSS-normal visual output byte-for-byte while making the DOM carry the _rendered_ semantics instead of the source formatting:

- `<code>\n  ${children}\n</code>` → `<code>${children}</code>` — the `PinkInlineCode` case, fixed by default.
- `<span>\n  ${a}\n  ${b}\n</span>` → `${a} ${b}` — the JSX-`{' '}` case, no hatch needed.
- `</b>\n<i>` between inline siblings → one space — unlike Vue, the visible gap survives.
- Wanting _no_ space cross-line isn't a spacing intent the browser honors today either; write the pieces on one line — ordinary formatting, not an escape.

An interpolation slot counts as a content item (never a boundary), so whitespace between a slot and its neighbors follows the same two rules.

### D3 — `pre` and `textarea` preserve verbatim, statically

The parser knows tag names at static-processing time; inside `pre`/`textarea` (and their descendants for `pre`) nothing collapses. CSS-styled whitespace sensitivity (`pre-wrap` on a `code`) is invisible statically and deliberately not special-cased: such elements get their formatting collapsed, which is the correct outcome for the docs/inline-code cases, and genuinely preformatted content belongs in `pre`, an interpolation, or same-line authoring.

### D4 — One pass over the statics, pre-cache

The collapse runs on the template's static chunks before context caching, so it costs once per call site for the life of the page and the cached statics are already normalized — server and client share the path, so `renderToString` markup and hydration DOM agree by construction. Interactions handled in the same pass: `compile-component-tags` runs first (component-element children regions get the same collapse via their own compiled templates); `table-scope`'s `<!--⚡-->` markers are content items, not whitespace; a whitespace run split across a chunk boundary by an interpolation slot is two runs (each judged against its own side, per D2's slot-as-content rule).

### D5 — DOM-shape change is accepted and documented

Fewer text nodes per template (typically one per formatted line removed). Consumers asserting on `childNodes`/`innerHTML` snapshots see diffs; visually nothing changes under normal CSS. Called out in the changeset; core's own test expectations updated in the same change.

## Risks / Trade-offs

- [An author relies on rendered cross-line indentation inside a CSS-`pre-wrap` element] → that content belongs in `pre` or an interpolated string; README documents the rule and both outs.
- [Hidden reliance on formatting text nodes in core internals (paths, reconciliation)] → the collapse happens before path resolution, so paths are computed against the normalized statics; the full suite plus new specs gate it.
- [Ecosystem snapshot breakage on upgrade] → minor release with an explicit DOM-shape note; visual behavior unchanged.

## Migration Plan

Minor `@loom-js/core` release. No consumer action for rendering; snapshot-style tests re-record. Pink follow-up (restore `PinkInlineCode`'s template form) rides a later pink change.

## Open Questions

None.
