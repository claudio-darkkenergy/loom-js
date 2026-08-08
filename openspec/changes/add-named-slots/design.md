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

### Shadow-boundary probe result (task 1.1, probed 2026-08-07)

`tests/unit/compile-component-tags/shadow-boundary.spec.ts` (authored as `tests/unit/named-slots.spec.ts`, relocated by the task 5.3 spec split). The two distribution worlds can never meet on the same nodes — the boundary is structural, not something the contract has to defend:

- **Native path (custom-element markup):** `<ns-…>` markup in a loom template carries no component-tag signal, so the transform never scans it. The native parser builds the element, it upgrades on connect, its `[slot]`-labelled children remain light-DOM children of the host (`mount` into the shadow root never touches them), and `assignedSlot` confirms the platform distributed them into the shadow template's named `<slot>`. Loom is entirely absent from this path.
- **Compiled path (element syntax):** `<${ShadowThing}>…</>` calls the component function, which renders its template function directly — **no custom element is instantiated and no shadow root ever exists** on this path. Loom's distribution is therefore the only distribution wherever the compiled contract applies.

Consequence for Decision 2: "the labelled elements must reach the shadow host un-grouped" is satisfied by the fast bail-out alone — labelled children of a _nested custom element inside a children region_ sit at depth > 0, where Decision 4 passes `slot` attributes through untouched. Task 3.3 needs no new code, only the depth->0 pass-through rule and test coverage.

### Decision 3: The component-side contract is a `slots` prop of per-region `ContextFunction`s (task 0.1, decided 2026-08-07)

A component receives its named regions as `props.slots` — an object mapping each region name to a `ContextFunction` — and renders a region by interpolating it: `${slots.header}`. The unlabelled remainder stays `children`, untouched. An absent region is simply an absent key: `resolveValue` already renders `undefined` as an empty text node (`resolve-value.ts:34`), so "an absent region renders nothing" costs zero new code.

Why this shape over the other two candidates:

- **Reserved `<slot name>` markers in the component's own template — rejected.** It collides head-on with Decision 2: a shadow-enabled component's template legitimately contains native `<slot name="…">` elements for the platform to operate, so loom claiming that same syntax for light-DOM replacement would make one construct mean two things depending on an option the call site cannot see. Mechanically it would also require loom to locate and replace rendered nodes — the render-time node-walking Decision 1 already rejected.
- **`children` whole plus a filtering helper — rejected.** It turns every multi-region component into imperative child-inspection code and adds a public helper API, when the framework's composition idiom is "interpolate a `ContextFunction`".
- **`slots` prop — accepted.** It is the exact generalization of what `children` already is (one synthesized `ContextFunction` → a named map of them), it types naturally as a reserved prop, and it makes functional-form symmetry (Decision 5) automatic rather than designed.

Precedence note: markup-derived regions are assigned onto the compiled props after attribute props (exactly as markup children already clobber a `children=` attribute in the parent change), so labelled children win over an explicit `slots=` prop.

### Decision 4: Slot-label grammar (task 0.2, decided 2026-08-07)

Extends the parent change's Accepted Grammar. Everything here applies **only inside a component element's children region** — outside one, `slot` remains an ordinary attribute/prop with today's semantics, and templates without component tags are never scanned at all (the parent's fast bail-out is untouched).

**Where a label is recognized** — on the region's **top-level nodes only** (depth 0 of that children region):

- A plain HTML element whose open tag carries `slot="name"` (or `'…'`): the element and its entire subtree compile into region `name`. The attribute stays on the element — it is inert in the light DOM, exactly as the platform leaves it on natively-assigned nodes.
- A component element with a static `slot="name"` prop: the compiled component becomes region content; the `slot` prop is **consumed** (not forwarded) — at depth 0 it is addressing, not data.
- Multiple top-level nodes sharing a label concatenate into that region in source order (matching native multi-node slot assignment).
- Text and interpolations at depth 0 are never labelled — native slot assignment is element-only; they always belong to the unlabelled remainder.

**Depth model.** The scanner tracks region depth with a forgiving tag stack: an open tag pushes unless it is void (`area base br col embed hr img input link meta param source track wbr`) or self-closed (`…/>`); a close tag pops to the nearest matching open (an unmatched close is ignored). This approximates native parsing for the common implied-close cases (`<li>`, `<p>`) so long as the _containers_ are explicitly closed. HTML comments and raw-text elements (`<script>`, `<style>`) containing tag-like text inside a slot-bearing children region are outside the grammar — the depth tracker reads markup literally.

**Throws** (transform time, naming the construct with surrounding text — parent Decision 6 discipline), all at depth 0 only:

- `slot=${…}` — an interpolated label, on a plain or component element. Grouping happens at transform time against static chunks; a dynamic label cannot be grouped. (At depth > 0 an interpolated `slot` is an ordinary attribute update on a real element and passes through — it has native meaning there.)
- Valueless `slot`, an unquoted value (`slot=name`), or an empty label (`slot=""`).
- A quoted label that does not close in the same chunk (the interpolated-label case seen from the other side).

**Pass-through (not labels, never throws):** any `slot` attribute at depth > 0 — nested slot attributes retain their native meaning (e.g. children of a nested custom element distributing into its shadow DOM).

**Cost guarantee.** Render-time cost and plan shape for a label-free region are identical to the parent change — grouping produces different output only when a depth-0 label exists. The added scanning (depth bookkeeping, `slot=` inspection of depth-0 open tags) is transform-time work, incurred once per call site ever (parent Decision 1).

### Decision 5: Functional-form symmetry is the compiled form itself (task 0.3, decided 2026-08-07)

The element syntax compiles to `Component({ slots: { header: ‹ContextFunction›, … }, children: ‹ContextFunction› })` — so the functional form **is** that same call, written by hand: `Card({ slots: { header: H2({ children: 'Title' }) }, children: … })`. `slots` becomes a reserved prop (`slots?: PlainObject<TemplateTagValue>` on `ReservedProps`); the component addresses `slots.header` identically regardless of which form composed it. No new runtime code — the symmetry requirement is satisfied by there being exactly one form after compilation.

The type is deliberately `TemplateTagValue`-valued rather than `ContextFunction`-valued: element syntax always produces `ContextFunction`s, but the functional form may pass anything interpolatable (a string, a `Node`), which the render pipeline already handles — restricting it would be an artificial narrowing the runtime doesn't need.

### Decision 6: Byte budget — 768 B min+gzip over the measured baseline (task 0.4, decided 2026-08-07)

The slot extension (depth tracking, label recognition, region partitioning, throw paths) may add **at most 768 bytes min+gzip** to `dist/index.mjs`. Measured baseline immediately before this change: **8,967 B** (not the 8,987 B recorded from the parent change's close — 20 B of drift, same measurement re-run 2026-08-07), giving a ceiling of **9,735 B**. Measurement command: `pnpm -F @loom-js/core build-package`, then `esbuild dist/index.mjs --minify | gzip -9 | wc -c` with the workspace esbuild (`node_modules/.pnpm/node_modules/.bin/esbuild` — no package in `core` depends on esbuild directly). Per the parent's discipline: a breach is a design smell to be redesigned, not renegotiated.

## Implementation findings (2026-08-07)

- **Byte budget: exceeded — 884 B of 768 B (final bundle 9,851 B vs the 9,735 B ceiling), flagged for ratification.** The Decision 6 number was a pre-implementation estimate; the minimal implementation of the recorded grammar measured 952 B, and dedicated trimming (a shared `readName` for four duplicated scan loops, a shortened label error, local throw helpers, optional `Frame`/`PlainTag` fields so hot-path object literals stay small, deduplicated region rendering) brought it to 884 B. The remaining 116 B cannot come out without cutting recorded grammar semantics: cross-chunk open-tag scanning (needed for `<div class=${x} slot="a">`), quote-aware attribute walking (needed so `title="slot=nope"` is not a label), the void-element list and implied-close recovery (needed so depth 0 is judged correctly). One counterintuitive data point: inlining the single-use `mergeRegion` helper _grew_ the gzip output by 35 B — the factored form compresses better. Per Decision 6's own rule this breach is recorded as a breach, not silently renegotiated; recommendation is to re-set the budget to the measured 884 B, since the alternative designs (two-pass region re-parse, render-time node walking) are larger or already rejected.
- **Fragment-rooted regions cannot sit in `children` arrays (pre-existing).** `handleArrayValue` (`get-text-update.ts`) coerces an array-rooted resolved value (a synthesized region's fragment root) to `String(nodes)` when it appears as an _item of a children array_ — so `Header({ children: [slots.col1, …] })` renders `"[object Text],[object HTMLDivElement]"`. This is the reconciliation limitation the change's Non-Goals explicitly leave untouched. Consequence: components receiving regions should interpolate them in templates (`${slots?.col1}` — the array path there handles node arrays correctly), which is what `PinkGridHeader` now does. Surfaced by the 4.3 conversion, not by the core suites (both composition forms in the specs interpolate).
- **`PinkGridHeader` became a template component.** The functional `Header({ children: [...] })` composition both hit the array limitation above and could not have injected the grid classes into opaque region `ContextFunction`s; as a template component it interpolates its regions and callers own the `grid-header-col-N` classes on their slotted elements (the old class-merge was already being bypassed by the only real consumer — `layout.ts`'s `is: () => Div(…)` arrow discarded the merged props). Native-attribute passthrough is delegated by composing `<${Header}>` from tags inside the template — the props-to-attributes glue (`mergeAllowedAttrs` onto `$attrs`/`$on`) stays in the one place that owns it, and `PinkGridHeaderProps` remains `Omit<HeaderProps, 'children'>`. What the old `...headerProps` spread actually forwarded was always `Header`'s allowlist (`attrs`, `on`, top-level `className`/`id`/`style`), so this is exact parity, not a narrowing.
- **4.3 DOM proof:** pre- and post-conversion builds served side-by-side under puppeteer; serialized `#layout` trees (whitespace-only text ignored) are **byte-equal modulo `slot` attributes** with zero page errors — the only delta is `slot="col1"` on the labelled `div`, kept by Decision 4; the labelled `PinkTopNav`'s label was consumed at compile time and leaves no attribute.
- **Second latent fragment bug, now fixed (the parent change fixed the first).** `handleArrayValue` (`get-text-update.ts`) anchored insertions on `liveNode.parentElement` — `null` for a top-level slot of a fragment template, whose parent is the `DocumentFragment` itself — so an array-valued top-level fragment slot silently dropped its nodes. Unreachable before this change; a named region forwarded into another component element's children (the `PinkGridHeader` → `<${Header}>` composition) puts a fragment-rooted region on exactly that slot. Fixed by anchoring on `parentNode` (identical for element parents; hosts insertion for fragments), covered by the "region interpolated at the top level of another component element's children" spec. Note the sibling limitation stands unchanged: fragment-rooted values as _items of a children array_ still stringify (the finding above) — that one is real reconciliation work, not a one-word anchor fix.
- **Module split (repo SRP feedback + audit revisit condition).** `compile-component-tags.ts` became the folder module `compile-component-tags/` — `grammar.ts`, `regions.ts`, `emit.ts`, `scanner.ts`, `types.ts`, `index.ts` — with specs mirrored under `tests/unit/compile-component-tags/` (shared `fixtures.ts`, one spec file per concern; the parent change's suites moved there too). Public import path unchanged (CJS-mode NodeNext resolves the folder index); split cost +13 B min+gzip.

## Risks / Trade-offs

- **The scanner's scope grows.** Today the transform treats children-region text as opaque; grouping by `slot="…"` requires recognizing attributes on _top-level elements of the region_ — a real expansion of what the grammar parses. → Mitigation: specify the accepted grammar for slot labels up front (section 0), exactly as the parent change did, and throw on anything outside it.
- **Byte budget.** The parent change landed at 1,524 B of its 1,536 B min+gzip budget — there is no headroom left in it. → This change sets its own budget (section 0) against the post-parent baseline of 8,987 B, measured with the same command.
- **Hot path.** Same mitigation as the parent: templates without component tags stay byte-identical (the no-op guard test already exists), and slot grouping only runs inside children regions that actually contain `slot=` labels.
- **Two consumers, one contract.** The component-side contract must serve both light-DOM distribution and shadow pass-through without the author writing two versions. → Contract question is section 0's blocking decision; nothing gets built before it closes.

## Open Questions

None — all four section-0 questions closed 2026-08-07:

- **The component-side contract** → a `slots` prop of per-region `ContextFunction`s. See Decision 3.
- **Slot-label grammar** → top-level region nodes only, static labels only, forgiving depth stack; interpolated/valueless/empty labels throw at depth 0 and pass through below it. See Decision 4.
- **Functional-form symmetry** → the compiled form is the functional form; `slots` becomes a reserved prop. See Decision 5.
- **Byte budget** → 768 B over the re-measured 8,967 B baseline (ceiling 9,735 B). See Decision 6.
