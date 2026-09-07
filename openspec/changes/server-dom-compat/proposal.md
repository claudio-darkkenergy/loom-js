# Server DOM Compat

## Why

The docs claim "you supply a window," but only linkedom was ever exercised. Verification (2026-09-07, scratchpad matrix against built core): **jsdom works**; **Happy DOM fails** — loom calls `setAttribute` with an empty attribute name somewhere in template attr application, which lenient DOMs tolerate and Happy DOM (spec-correctly) rejects with `InvalidCharacterError`. Nothing in the suite renders through any implementation but linkedom, so the pluggability claim is untested surface. The docs now state the honest matrix ("known loom bug, tracked; support is planned") — this change is that tracking.

## What Changes

- Fix the empty-attribute-name `setAttribute` call (suspect sites: the derived-name paths in `lib/templating/get-attr-update.ts`) — a lenient-DOM-masked bug worth fixing regardless of Happy DOM.
- The server suite gains a **DOM-implementation matrix**: the existing server render tests run against linkedom, jsdom, and Happy DOM (dev-deps of core's tests only), so "you supply a window" is continuously verified, not asserted.
- Docs: the "Choosing a DOM implementation" section's Happy DOM boundary lifts once green (same change updates it per the propagation requirement). The one-implementation-per-process cache rule stays documented (structural, not fixed here).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `server-rendering`: the string-render requirement gains a portability scenario — rendering succeeds under spec-strict DOM implementations (jsdom, Happy DOM), with no reliance on lenient validation.

## Impact

- `packages/core/src/lib/templating/get-attr-update.ts` (or wherever diagnosis lands) — the empty-name fix; **patch** changeset.
- `packages/core/tests/server` + core devDeps (`jsdom`, `happy-dom`) — the matrix.
- README + topic 10 — boundary paragraph updated on green.
- Independent; nice-to-have before `server-first-loom-app` widens server-render usage.
