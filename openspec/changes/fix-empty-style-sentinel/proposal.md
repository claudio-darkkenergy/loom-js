# fix-empty-style-sentinel

## Why

A `style=` binding whose value resolves to nothing renders the template placeholder token into the DOM: the parsed template leaves `style="⚡"` on the element, and the object/array style branches in `get-attr-update.ts` only ever call `style.setProperty` — so when zero properties apply (an empty array, an object whose values are all nullish, or nested combinations like `[{ '--x': undefined }, undefined]`), nothing overwrites the token and it serializes into the markup. The `element-syntax-conversion` change hit this on `PinkButton`, worked around it consumer-side (conditionally omitting `style`), and flagged the core fix as a follow-on. The same code path has a second latent defect the fix naturally resolves: object/array style updates merge into the existing inline style across re-renders, so a property dropped from the new value stays applied (stale styles) — while string style values already replace wholesale via `setAttribute`.

## What Changes

- **Style application becomes declarative replacement.** In the attr-slot path (`applyValue`), the object/array style branches clear the element's inline style before applying the resolved properties. Each application fully determines the inline style: the parsed token can never survive, and properties absent from the new value are removed. When nothing applies, the `style` attribute is removed entirely — matching the existing falsy-removal semantics.
- **The `$attrs` style entry gets the same replace semantics** (`applyAttrsEntry`), so the two paths stay symmetric. It has no token to leak (special attrs are removed at bind time), but it shares the stale-merge behavior.
- **The `PinkButton` workaround is removed** — the conditional style omission reverts to passing `style` straight through, validating the fix at the motivating site.

This is a behavior change for re-renders that drop style properties (previously the stale property persisted; now it is removed), aligning object/array values with the string value's existing replace behavior.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `attr-value-semantics`: New requirement — style bindings apply by replacement: each resolved value fully determines the element's inline style, a value resolving to no properties removes the `style` attribute, and the template placeholder token never serializes into the DOM.

## Impact

- `packages/core/src/lib/templating/get-attr-update.ts` — the two style branches in `applyValue`, the two in `applyAttrsEntry`, and `mergeAndSetStyleValues` (the shared applier).
- Tests: `packages/core/tests/unit/attr-value-semantics.spec.ts` — new scenarios for empty-resolving style values (token must not leak; attribute removed) and replacement-on-re-render (TDD workflow applies).
- Specs: delta on `openspec/specs/attr-value-semantics/spec.md`.
- `packages/pink/src/elements/pink-button/pink-button.ts` — workaround removal.
- Changesets: `@loom-js/core` minor (observable behavior change on style re-renders), `@loom-js/pink` patch (internal simplification, no API change).
- No public API surface changes.
