# Server DOM Compat

## Why

The docs claim "you supply a window," but only linkedom was ever exercised. Verification (2026-09-07, scratchpad matrix against built core) surfaced a Happy DOM `InvalidCharacterError`; running the matrix as real tests surfaced three more defects behind it (see design Context F1–F4): loom read the wrong `Attr` accessor, relied on shared class realms, cached templates against the first document forever (a server document leak, and the true cause of the old "one implementation per process" rule), and silently lost the `url` option under jsdom's spec-unforgeable `location`. Nothing in the suite rendered through any implementation but linkedom, so the pluggability claim was untested surface. This change is the tracking the docs' "known loom bug, tracked" line points at.

## What Changes

- Attribute names read from `Attr.name` (spec accessor), never `Attr.nodeName` — fixes the empty-name `setAttribute` (D1). **Done.**
- Slot wiring checks node kinds via realm-free `nodeType`, not `instanceof getWindow().Text/Comment` (D5). **Done.**
- The template cache becomes per (chunks, document) — plan shared, `{fragment, paths}` per document via `WeakMap` (D3). Deletes the one-implementation-per-process rule, fixes multi-window custom-element upgrades under Happy DOM, and stops pinning the first render's document.
- The injected location resolves through the provider seam (`getLocation()` override, D4) — the `url` option works under unforgeable-`location` implementations (jsdom).
- The server suite gains a **DOM-implementation matrix**: the server render tests run against linkedom, jsdom, and Happy DOM (dev-deps of core only), so "you supply a window" is continuously verified, not asserted. **Done (red pinned; goes fully green with D3/D4).**
- Docs: "Choosing a DOM implementation" reports the verified matrix, deletes the one-per-process rule, and notes the jsdom direct-`window.location` boundary.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `server-rendering`: the string-render requirement gains a portability scenario — rendering succeeds under spec-strict DOM implementations (jsdom, Happy DOM) with no reliance on lenient validation, shared class realms, or a process-wide first document; the window-normalization scenario now resolves the `url`-derived location through the provider seam.

## Impact

- `packages/core/src/lib/templating/get-attr-update.ts` — `Attr.name` fix (done).
- `packages/core/src/lib/templating/set-updates-for-paths.ts` — realm-free slot checks (done).
- `packages/core/src/html-parser.ts` — per-document template cache (D3).
- `packages/core/src/lib/dom.ts`, `src/server.ts`, `src/router.ts` — location seam (D4).
- `packages/core/tests/server` + core devDeps (`jsdom`, `happy-dom`) — the matrix (done).
- README + topic 10 — boundary section rewritten on green.
- **Minor** changeset — lifts a documented restriction; `url` contract becomes uniform.
