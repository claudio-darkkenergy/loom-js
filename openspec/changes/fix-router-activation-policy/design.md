## Context

`Router.route()` (`packages/core/src/router.ts:67`) early-returns on `ctrlKey || metaKey` and otherwise `preventDefault()`s and pushes history. The gap: shift (new window) and alt (download) are equally native intents, and an event another handler already consumed should not be re-claimed. The file also carries the audit's 🟡 SRP entry: the `Router` class mixes matching (`transform`), param extraction (`parseParams`, which mutates `this.params`), lazy-import coordination, and History management. The audit's recommended fix — module-level helpers in the same file, public API unchanged — was scoped for exactly this occasion ("resolve the next time the affected file is touched").

## Goals / Non-Goals

**Goals:**

- Modified or already-consumed activations fall through to the browser; plain left-clicks keep routing exactly as today.
- The 🟡 SRP entry resolves per its own recommended fix.

**Non-Goals:**

- Deprecated `onRoute` (`routing.ts`) — deprecated surface, not brought up to policy; its doc comment gains nothing.
- Any change to matching/param/lazy-load behavior or the public API.
- Speccing the full router (the new `spa-routing` capability covers activation policy only).

## Decisions

### Decision 1: The guard covers all four modifiers plus `defaultPrevented`

`ctrlKey || metaKey || shiftKey || altKey || defaultPrevented` — matching native semantics (new tab / new window / download) and the ecosystem convention (e.g. React Router's modified-event check). No `button` check: per the UI Events spec, `click` fires only for the primary button — middle-clicks arrive as `auxclick` and never reach the handler. Alternative considered: shift only (the filed finding) — rejected as leaving the same class of bug half-fixed.

### Decision 2: Refactor to pure module-level helpers, class as orchestrator

Per the audit entry: extract `matchRoute` (config + pathname → matched route, importer, segment values) and `extractParams` (route path + segment values → params object, replacing the `this.params` mutation) as module-level functions beside the class; `validateRoute` stays a private method (it needs `redirect` and `routesConfig`). Helpers are pure — inputs in, values out — so they need no `this` and read independently. Behavior net: the existing suite (route-dependent `lazy-import` specs included) plus the new activation specs.

### Decision 3: Byte budget — 64 B total (fix + refactor)

Against the post-`add-core-element-components` baseline measured in task 0.1. The guard is a few tokens; the refactor targets ~neutral (the named-slots change recorded that factored helpers can compress _better_ than inlined code). Same measurement command and breach discipline as always.

## Risks / Trade-offs

- **[Refactor regression in matching/params]** → behavior is pinned by the existing suite (lazy-import specs route through real configs) and the pure helpers are direct extractions, not rewrites.
- **[Consumers relying on shift-click hijack]** → none plausible; the fix restores native behavior users expect.
