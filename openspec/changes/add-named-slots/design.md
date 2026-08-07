## Context

`add-template-component-syntax` (implemented 2026-08-06) compiles a component element's children region into a **synthesized component** — a stable-identity template function rendering as a rootless fragment — delivered to the component as its single `children` prop (its design.md, Decision 3). That mechanism is the foundation here: named slots are the multi-region generalization of the same idea, and this change was deliberately sequenced after that one so the children compiler existed before anything tried to generalize it.

The platform only provides named-slot distribution inside shadow DOM. `defineElement` renders to the light DOM by default (encapsulation is a separate opt-in), so loom must distribute `[slot]`-labelled content itself in the default case — this was the open question deferred out of `fix-custom-element-registration` ("Do light-DOM elements ever need multiple named regions?"). The use case that answers it: `PinkGridHeader`'s `gridCol1`/`gridCol2` object props, which plumb `ContextFunction`s through options objects precisely because there is no way to label content regions in markup.

## Goals / Non-Goals

**Goals:**

- Children of a component may carry `slot="name"` labels; the component receives each named region separately, plus the unlabelled remainder as ordinary `children`.
- Distribution works in the light DOM (loom's own), and defers to the platform inside shadow roots.
- Built as an extension of the synthesized-children mechanism — per-region synthesized components with stable identity — not a parallel system.
- Available from both composition forms (element syntax and functional).

**Non-Goals:**

- Replicating native `<slot>` semantics beyond distribution: no fallback content, no `slotchange`, no `assignedNodes` emulation.
- Any change to `activity`/effect reconciliation.
- Custom-element registration (shipped separately in `defineElement`).

## Decisions

### Decision 1: Named regions compile like children — one synthesized component per region

Each named region becomes its own synthesized component (stable identity allocated at transform time, rendered as a rootless fragment), exactly as the single children region does today. This inherits the parent change's guarantees for free: no context clobbering (its Decision 3), per-slot context reuse (its probes), no `key` forwarding needed (its Decision 10).

- **Alternative:** distribute at render time by walking rendered children and physically moving `[slot]` nodes. Rejected — it would fight the context-reuse machinery (nodes belong to their synthesized component's fragment root) and reintroduce exactly the ordering/reconciliation questions the synthesized-component design closed.

### Decision 2: The shadow boundary belongs to the platform

When the receiving component renders into a shadow root, loom does not distribute — the `[slot]`-labelled elements must reach the shadow host as ordinary light-DOM children so native `<slot>` distribution applies. Loom's distribution is for the default (light-DOM) case only. The mechanics of "must reach the host un-grouped" interact with the open contract question below and are settled there, not here.

## Risks / Trade-offs

- **The scanner's scope grows.** Today the transform treats children-region text as opaque; grouping by `slot="…"` requires recognizing attributes on _top-level elements of the region_ — a real expansion of what the grammar parses. → Mitigation: specify the accepted grammar for slot labels up front (section 0), exactly as the parent change did, and throw on anything outside it.
- **Byte budget.** The parent change landed at 1,524 B of its 1,536 B min+gzip budget — there is no headroom left in it. → This change sets its own budget (section 0) against the post-parent baseline of 8,987 B, measured with the same command.
- **Hot path.** Same mitigation as the parent: templates without component tags stay byte-identical (the no-op guard test already exists), and slot grouping only runs inside children regions that actually contain `slot=` labels.
- **Two consumers, one contract.** The component-side contract must serve both light-DOM distribution and shadow pass-through without the author writing two versions. → Contract question is section 0's blocking decision; nothing gets built before it closes.

## Open Questions

- **The component-side contract** — how a component template addresses a named region. Candidate shapes: a `slots` prop (`slots.header` as a `ContextFunction` per region); reserved `<slot name="…">` markers in the component's own template that loom replaces; or keeping `children` whole plus a helper. This is the blocking decision; it also determines how the shadow pass-through works (Decision 2) and what the functional form's symmetric API looks like.
- **Slot-label grammar** — where `slot="name"` is recognized (top-level region elements only? nested?), whether the label may be interpolated (`slot=${name}`), and what throws. Must be written down before the scanner grows, per the parent's Decision 6 discipline.
- **Functional-form symmetry** — what `Component({ slots: … })` (or equivalent) looks like so the two forms stay interchangeable sugar.
- **Byte budget** — the number, set against the 8,987 B post-parent baseline.
