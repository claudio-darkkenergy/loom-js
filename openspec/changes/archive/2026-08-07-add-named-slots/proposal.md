## Why

A loom component accepts exactly one undifferentiated content payload — `children`. Anything with more than one labelled region (a card with header/body/footer, `PinkGridHeader`'s columns) falls back to prop-plumbing `ContextFunction`s through object props (`gridCol1: { is: () => Div({ … }) }`), which is the same nested-call readability problem `add-template-component-syntax` just removed for the single-region case. That change's children mechanism (markup compiled to a synthesized component) is now implemented and is the natural foundation for the multi-region counterpart — which is why this was deliberately sequenced after it rather than designed alongside it.

Lineage: deferred from `fix-custom-element-registration` task 6.2 (archived 2026-08-04, "no multi-region use case exists yet" — `PinkGridHeader` is that use case), then tracked as `add-template-component-syntax` task 6.1, now spun out as its own change.

## What Changes

- **`[slot]`-labelled content distribution**: children markup carrying a `slot="name"` attribute is grouped by name and exposed to the component as labelled regions, alongside the unlabelled remainder as ordinary `children`.
- **Light-DOM first**: loom distributes `[slot]` content itself. Native named slots exist only in shadow DOM, and `defineElement` renders to the light DOM by default — so distribution cannot lean on the platform.
- **Builds on synthesized children, not around them**: each named region compiles to its own synthesized component (stable identity, rootless fragment), extending `add-template-component-syntax` design.md Decision 3 rather than reshaping it. One region today is `children`; N regions are N synthesized components.
- **Shadow-DOM interop stays native**: when a `defineElement` component opts into `shadow`, the platform's own `<slot>` distribution applies; loom's distribution must not fight it. The boundary between the two is a design decision.
- **Works in both composition forms**: the functional form (`Component({ slots: … })` or equivalent) and element syntax (`<${Card}><h2 slot="header">…</h2>…</>`); the exact component-side contract (how a template addresses a named region) is the central design decision.

Non-goals: replicating full native `<slot>` semantics (fallback content, `slotchange` events, `assignedNodes`) in the light DOM; any change to `activity`/effect reconciliation; custom-element registration (already shipped in `defineElement`).

## Capabilities

### New Capabilities

- `named-slots`: Components can accept multiple labelled content regions via `[slot]`-attributed children, distributed by loom in the light DOM and left to the platform in shadow DOM.

### Modified Capabilities

- `template-component-syntax`: the children-region compilation gains slot-aware grouping — children of a component element are no longer necessarily a single undifferentiated payload.

## Impact

- **Code:** `packages/core/src/lib/templating/compile-component-tags.ts` (children-region grouping), `packages/core/src/component.ts` (props contract for regions), `packages/core/src/types.ts`, possibly `define-element.ts` (shadow boundary), `packages/core/README.md`.
- **Risk:** Medium-high — extends the same hot-path transform, so the parent change's guardrails carry over: the no-op guard (templates without component tags stay byte-identical), the throw-on-malformed contract, and an explicit byte budget. The parent landed at 1,524 B of its 1,536 B budget, so this change needs **its own budget** — there is no headroom left in the old one.
- **Release:** Minor changeset for `@loom-js/core` (additive).
- **Verification:** `test-ci`, `type-check`, `type-check-tests`; new specs; a real conversion — `PinkGridHeader`'s column props are the motivating example.
