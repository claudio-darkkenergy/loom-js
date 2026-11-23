# Proposal

## Why

Core parses a template with a placeholder token wherever a value goes, including attribute values (`x="⚡"`). Browsers validate SVG attribute values as they parse and clone, so a template like `` html`<rect x=${x} />` `` logs `Error: <rect> attribute x: Expected length, "⚡"` once when the template is parsed and again for every instance created. Plain attributes keep the placeholder in the cached template, so each clone carries it until its slot applies. The devtools HUD's toolbar icons log 22 of these errors each time it opens, and any app that draws SVG with dynamic attributes (icons, charts) gets the same noise.

## What Changes

- Every dynamic attribute is removed from the cached template, not only the special ones (`$click`, `$attrs`, …), so a clone never carries a placeholder. The slot sets the attribute while the instance is wired, before it reaches the document.
- Attribute slots are parsed under a marker attribute name with no value, so no attribute is ever parsed with the placeholder as its value. The plan takes each attribute's authored name from the template source, which keeps SVG's mixed-case names (`viewBox`) as written.
- No API change. Rendered markup, server-rendered output and hydration are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `template-instance-plan`: normalization removes every dynamic attribute rather than only special attributes, and no attribute value is parsed or cloned holding the placeholder.

## Impact

- `packages/core`: `html-parser.ts` (marker names when joining the statics), `lib/templating/compile-plan.ts` (read authored names, strip every dynamic attribute), and the style-attribute handling in `attr-updaters.ts` that guards against a surviving placeholder.
- A core patch changeset. The devtools HUD's icons stop logging once it is rebuilt against the fixed core; it needs no change of its own.
