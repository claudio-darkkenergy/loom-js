## Context

`DocsLayout` (post-`fix-per-render-hook-leaks`) is a `SimpleComponent` returning a tags `Div` whose children are two effect-wrapped branches: `pageEffect → routeEffect → sideNavToggleEffect → DocsSideNav` and `topicTocToggleEffect → DocContainer`. The toggle effects exist only to recompute one class each (`DocsSideNav__open`, `docContainer` `_open`), at the cost of re-rendering their entire subtree per toggle. `DocsSideNav` is already a `component()` (has `onMounted`/`onUnmounted`/`node()`); `DocContainer` is a `SimpleComponent` delegating to `PinkContainer` with an array of children — per the `element-syntax-conversion` pilot's amended D1 (and its array-limitation finding), it must stay functional.

Available primitives: `watch` returns an `Unsubscriber` (`reactive-unsubscribe`); lifecycle hooks fire correctly across unmount/remount, and `onMounted`/`onUnmounted` handlers register once per persistent context and re-fire per transition (`unmount-teardown`).

## Goals / Non-Goals

**Goals:**

- A TOC toggle click mutates one class: no content re-render, no topic refetch, DOM node identity preserved. The side nav stays declaratively bound (cheap boundary — see D1).
- The TOC watch subscription is balanced: registered on mount, released on unmount, re-registered on remount — never stacking across docs entries.
- Initial TOC state renders correctly (from `activity.value()`) before the watch's immediate fire confirms it.

**Non-Goals:**

- Element-syntax conversion of `DocContainer` or the docs page components (sweep territory; array limitation applies to `DocContainer`).
- Any change to toggle activities, `useDocsLayout`, media-query behavior, or the routeEffect boundary that recomputes side-nav `isSelected` per topic (that one earns its re-render).

## Decisions

**D1 — Imperative escape hatch only where the re-render cost is real (revised during review).** Loom's reactivity is subtree-grained — an effect boundary cannot wrap a single attribute — so a declarative toggle costs a full subtree re-render. That cost is decisive for the TOC (`DocContainer` re-renders the action bar, breadcrumbs, and the whole topic content) and negligible for the side nav (a short list). Per-site verdicts: the TOC uses `topicTocToggle.watch` + `classList.toggle` on the `DocContainer` root, found via `node().querySelector('.' + styles.docContainer)`; `DocsSideNav` keeps its declarative `sideNavToggleEffect` boundary — the framework idiom (single source of truth, auto-managed subscription via unmount teardown) wins where there is no measured cost. The symmetric all-imperative version was implemented and rolled back: it traded idiom for perf at a site with nothing to gain. Follow-up identified: a core reactive-attribute-binding primitive (attr-level effects over the existing `get-attr-update` machinery + `Unsubscriber`s) would make even the TOC site declarative; this change is its motivating use case.

**D2 — `DocsLayout` converts to `component()`.** It owns genuine structure (the flex two-pane wrapper), so template conversion is consistent with the sweep's own D1 rule — and it is the only way to get `onMounted`/`onUnmounted`/`node()` where the TOC class target lives. Its template root is a plain `<div>` with `${...}` slots (no compiled-children-region array hazard). The `...props` spread onto the old `Div` is dropped: the call site forwards only `children`/`className` plus route props that the markup never consumed; `class` binds explicitly.

**D3 — Mount-scoped subscription lifecycle (TOC watch).** `DocsLayout` registers its lifecycle handlers once (first render); the handlers close over a shared `unsubscribe` slot in that first render's scope: `onMounted` (re-fired per mount) creates the watch and stores its unsubscriber; `onUnmounted` invokes it. Registrations stay balanced 1:1 with mount transitions. Note: lifecycle hooks only keep their **first** registered handler per event (`createLifeCycleHook` guard), so all unmount work must live in one handler.

**D4 — Initial TOC state from `topicTocToggle.value()` in the template; the watch's immediate fire re-asserts it on mount.** The template renders the container's `_open` class from the toggle's current value, so there is no unstyled flash; the watch registered in `onMounted` fires immediately (by `watch`'s contract) and confirms/corrects the class. Manual-toggle persistence across docs entries (from `hook-setup-idempotence`) is thereby preserved: remount renders whatever the shared activity currently holds. The side nav gets the same persistence for free through its effect boundary.

## Risks / Trade-offs

- [`querySelector` coupling from `DocsLayout` to `DocContainer`'s class] → Scoped to one CSS-module token that `DocsLayout` itself assigns in the same template; if `DocContainer` ever owns its class internally (e.g. post-conversion), the watch moves with it.
- [`...props` no longer spread onto the layout root] → Audited: the only meaningful consumers were `className` (kept) and inert route props; verified in-browser as part of the checks.
- [Element-syntax conversion of `layout.ts` could collide with the sweep session] → `pages/docs/**` is untouched by the sweep to date; the conversion follows the sweep's own conventions, so a later sweep pass finds it already done.
- [Toggle behavior now bypasses the render pipeline] → That is the point; the spec pins class-only mutation plus node identity so a regression to re-rendering is detectable.
