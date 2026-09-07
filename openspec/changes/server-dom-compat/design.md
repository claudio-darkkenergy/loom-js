# Design — server-dom-compat

## Context

Templates cache per chunks identity against the first document (`html-parser.ts`: cached fragment + `importNode` into the current document — the documented reason for `importNode` over `cloneNode`). The verification matrix: linkedom OK; jsdom OK standalone; Happy DOM throws `InvalidCharacterError: setAttribute '' is not a valid attribute name` during a custom-element template render; mixing implementations in one process fails on cross-realm `importNode` (cache pollution — inherent, documented, out of scope to fix).

## Goals / Non-Goals

**Goals:** no empty-name `setAttribute` ever issued; the supply-a-window contract enforced by tests across three implementations.

**Non-Goals:** per-realm template caches (the one-per-process rule is documented and reasonable — a server picks one emulator); chasing every emulator's quirks beyond the matrix; performance claims about jsdom.

## Decisions

### D1 — Fix the bug at its source, not with a guard

Diagnose where a derived attribute name arrives empty (suspects: `get-attr-update.ts`'s `setAttribute(nodeName, …)`/`setAttribute(key, …)` paths under custom-element/`$`-prefixed handling) and stop producing the empty name — a blanket `if (name)` guard would bury whatever upstream produces it. The red test pins the exact reproducer from the matrix (custom element with a `$`-prefixed interpolated prop).

### D2 — The matrix is the same tests, parameterized

`tests/server` render tests run per implementation via a window-factory parameter — no per-emulator test forks. Happy DOM enters the matrix red and gates the fix; jsdom enters green and locks the verified claim.

## Risks / Trade-offs

- [jsdom/happy-dom weight in devDeps] → test-only, core's `devDependencies`; published package unaffected.
- [Emulator updates break the matrix] → that's the point — the claim stays continuously true or fails loudly.

## Migration Plan

Patch release. Docs boundary paragraph updated in the same change.

## Open Questions

None — diagnosis is the first task.
