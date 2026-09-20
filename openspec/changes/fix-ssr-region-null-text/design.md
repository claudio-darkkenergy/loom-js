# Design — fix-ssr-region-null-text

## Context

Element-syntax children/slot regions compile to synthesized fragment-rooted components (`compile-component-tags/emit.ts`), rendered per region. In the browser the suites (`slot-rendering`, `rendering`) pin exact DOM and pass; under `renderToString` (linkedom window) a leading `String(null)`-shaped text node precedes each rendered region. The server suite (`tests/server`) exercises routed pages and plain templates only — no compiled regions — which is the coverage gap that hid this.

## Goals / Non-Goals

**Goals:** byte parity for regions between server and browser output; the missing server coverage added so region serialization can't regress silently.

**Non-Goals:** changing region semantics or the nullish text contract (both behave correctly); linkedom version work unless the root cause demands it.

## Decisions

### D1 — Diagnose against the parity matrix, fix in core's shared path if possible

Root-causing starts from the characterization matrix (children region, provided slot, absent slot) diffed browser-vs-server at the node level. Preference order for the fix: a genuine core bug in the shared render path (fix benefits both sides); a server-entry-only divergence (fix scoped there); a linkedom behavioral difference (adapt core's usage, never patch linkedom). The suspicion to test first: the synthesized region component's fragment prefix/values handling producing a nullish token that the browser path drops and the server path stringifies.

### D2 — Tests assert parity, not just absence of "null"

The new server tests render the same fixtures the browser slot/rendering specs use and compare serialized output against the expected markup those specs pin — asserting the shape, so any future artifact (not just this one) fails. TDD: red on the current output first.

## Root Cause (recorded at apply)

The fragment-prefix suspicion from D1 was correct, one step earlier than the
synthesized component: `htmlParser`'s rootless-template cleanup
(`src/html-parser.ts`) strips the `<>` marker with
`textContent = textContent?.replace('<>', '') || null`. When a region's first
static is exactly `<>` (the region starts with an element — every compiled
children/slot region hits this), the replace yields `''`, which is falsy, so
`textContent` is assigned `null`. Per spec a `null` assignment to
`textContent` is treated as `''`; linkedom instead coerces it to the string
`"null"`, leaving a literal `null` text node that serializes ahead of the
region content. Shared-path bug class per D1's preference order: the fix is
one token in core (`?? ''` in place of `|| null`), byte-identical in the
browser, and repairs the server render.

## Risks / Trade-offs

- [Fix perturbs the hot browser path] → the full browser suite plus the "browser rendering unchanged" requirement gate it; prefer the narrowest seam the diagnosis supports.

## Migration Plan

Patch release; no consumer action. Lands before server-first prerendering is wired.

## Open Questions

None — root cause is the first apply task.
