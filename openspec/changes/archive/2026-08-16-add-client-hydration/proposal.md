# add-client-hydration — proposal

## Why

A pre-rendered loom page (SSR or SSG via `renderToString`) currently loses its server HTML the moment the client boots: `init()` wipes the root to the app shell/fallback, then the DOM churns again as lazy route content and async data land — two visible content flashes, making a pre-rendered page _worse_ than a client-only one. Hydration is the named next extension of the `server-rendering` capability, and any pre-rendering consumer — marketing sites, blogs, e-commerce, docs — needs client takeover to be invisible.

## What Changes

- **A hydrating boot mode** for the client entry: instead of mounting immediately, the framework keeps the pre-rendered DOM in place, renders the app detached (the render path already builds fully off-DOM; `mount()` is the only DOM-touching step), and performs a single atomic swap once the app has **settled**.
- **A settled signal** in core: a first-class way to know all pending async work (lazy route imports, async activity work) has landed. This is the primitive that makes the swap correct for data-driven pages _without_ markup polling — the server HTML stays visible until the client's own data effects resolve, so nothing regresses to placeholders.
- **No changes to server render output.** No hydration markers, no serialized state. Adopt-in-place hydration (claiming server DOM node-by-node) remains a documented future extension; a byte-identical swap makes its remaining advantage (DOM identity: focus/selection/iframe state) marginal.
- **Out of scope, deferred to follow-up changes:** dehydrated state / request-cache priming (with a settled signal this is a network-cost optimization, not a correctness need) and unifying the server's markup-quiet drain onto the settled signal.

## Capabilities

### New Capabilities

- `client-hydration`: hydrating client boot for pre-rendered pages — deferred single-swap takeover of existing DOM, gated on the app-settled signal; non-hydrating apps pay no bytes for it.

### Modified Capabilities

<!-- none — server-rendering requirements are unchanged (its Purpose already names hydration as a future extension); the settled signal introduces new behavior rather than changing any existing spec'd requirement -->

## Impact

- `packages/core/src`: new hydrate entry alongside `init` (`app.ts` / `lib/mount.ts` neighborhood); settlement tracking where async work originates (`activity.ts`, `lazy-import.ts`). Zero runtime dependencies preserved; tree-shakeable and byte-budgeted like `RouteLink`/`el()`.
- `packages/core/tests`: new specs (TDD per repo workflow), including a pre-rendered-DOM takeover scenario and settled-signal semantics.
- `packages/core/README.md`: hydration section; positions `renderToString` → hydrate as the pre-rendering story.
- No app changes required — `apps/loom` adopts SSG/hydration in its own later change.
- Changeset: `@loom-js/core` minor.
