> **STATUS: UMBRELLA — section 0 closed 2026-08-10.** Captured direction from an `explore` session (2026-08-07); the section-0 decisions (el() factory, RouteLink v1, media shape, tags endgame, array-limitation handling) closed in the 2026-08-10 apply session — see design.md Decisions 4–8. Implementation proceeds via spun-out changes (`add-spread-props` archived 2026-08-08; next: `add-core-element-components`, then pink/app conversion + tags retirement, then the lint package). This change tracks the umbrella tasks until the splits land.

## Why

`@loom-js/tags` exists to solve a limitation that no longer exists. The framework's invariant — one template per component, dynamic structure travels as values — meant markup could never cross a composition boundary, so plain HTML elements had to be lifted into value form: first as hand-rolled wrappers in the 2022 docs app, then via `$attrs`/`$on` (2023-12) and `mergeAllowedAttrs` when the flat-props-to-open-attributes impedance hit, finally standardized as `@loom-js/tags` (2024). Element syntax + named slots (2026-08) removed the root cause: markup now compiles into the synthesized-component values the runtime always needed, so composition sites accept markup directly.

What tags costs today: a full component context **per HTML element** across every consumer (pink pays this on nearly every element it renders); a duplicated attribute API (`className`/`on`/`attrs` props vs `class=`/`$click`/`$attrs` markup — two ways to say everything); and its role as the "kit-agnostic element layer" that UI kits build on — a role element syntax itself now fills better. The direct byte stake is small (tags is 1,595 B min+gzip); the context overhead, API duplication, and conceptual surface are the real stakes.

## Settled direction (project owner, 2026-08-07)

- **Element syntax is the primary documented authoring surface.** The functional form remains the underlying architecture — it is the compile target, and effects/arrays/conditionals are function-shaped by design — but docs, conventions, and examples lead with markup. "Primary," not runtime-"required": the functional form cannot be removed.
- **Survivors move to core, not pink.** Pink is one UI kit among possible many built on loom (+ Appwrite Pink); nothing kit-agnostic may live in it. Core gains a new **`RouteLink`** (wires `route()` itself — the router's natural companion, superseding tags' `Link`, which merely defaulted attrs and made callers pass `route`) and the **media utilities** (`Svg`, `Picture`, `ResponsiveImage`/`Source`), all tree-shakeable.
- **The repo stays prettier-only.** Enforcement of the authoring convention ships as a pluggable lint package (eslint rules as **enforcers, not codemods** — the framework has no external users yet, so migration is done by hand in-repo). Biome caveat: its GritQL plugins can express the patterns lint-only, without fixes.
- **Tags retires.** With no external consumers, deletion (rather than long deprecation) is viable once pink and the app no longer import it.

## Sweep findings (2026-08-07, grounding for the task breakdown)

- **~40 exports; ~33 are pure wrappers** (Div, Span, H1–H6, Section, Ul, …) — nothing but the props→attrs adapter; all uses convertible to markup.
- **Real logic:** `Svg` (sprite composition), `Picture`/`ResponsiveImage`/`Source` (media) → move to core. `Text` is a raw `document.createTextNode` helper — SSR-hostile (bypasses the planned DOM-provider seam) and trivially replaced; delete.
- **Wrapper-plus-defaults:** `Link`, `Button` — superseded by markup + core `RouteLink`.
- **Composition sugar:** `ListItems` (a `.map` helper) — dies naturally; authors own their loops.
- **Usage:** 54 consuming files (36 pink, 18 app). Shapes: ~10 children-prop compositions (convertible once hosts are template components), ~12 arrow-return value positions (effects/maps), and **8 polymorphic `is=` sites** (`PinkContainer is=${Footer}`, `is = Ul`, …) — the genuine residue: element-as-value with a caller-chosen tag.

## Capabilities

### New Capabilities

- `element-syntax-authoring`: element syntax is the documented primary way to author loom UIs; core provides the surviving element-level components (`RouteLink`, media utilities); an installable lint package enforces the convention for teams that want it.

### Removed Capabilities (eventual)

- The `@loom-js/tags` wrapper layer.

## Impact

- **Code:** `packages/core` (new `RouteLink`, media utilities, possibly an `el()` factory — see design open questions; byte budgets per addition), all of `packages/pink/src` (conversion to template components), `apps/loom/src`, deletion of `packages/tags`, a new lint-plugin package, README/docs overhaul.
- **Dependencies:** `add-spread-props` must land first (passthrough conversions need it). Coordinate the docs overhaul with `add-server-rendering` (also in flight) so the authoring story is rewritten once.
- **Risk:** Broad but incremental — pink converts component-by-component with the same DOM-parity proof used by `add-named-slots`; tags deletes only after zero imports remain.
- **Release:** Majors for `@loom-js/pink` and the tags retirement; minor(s) for `@loom-js/core` additions.
