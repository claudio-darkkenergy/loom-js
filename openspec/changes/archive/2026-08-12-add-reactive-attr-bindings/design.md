## Context

Dynamic attrs flow: `setUpdatesForPaths` pairs each dynamic attr with its element and calls `setReactiveUpdates(update, i, ctx)`, which registers a `reactiveEffect` over `ctx.values` — so every component re-render re-runs `update(updateValue, childCtx)` for that attr slot. `getAttrUpdate` builds the updater: standard attrs set/remove the attribute; special `$`-attrs (`attrs`, `on`, `props`) have dedicated updaters. `TemplateNodeUpdate` is `(value, valueCtx?) => void` — the child context is available at update time, and since `add-unmount-teardown` it carries `teardowns: Set<Unsubscriber>` released on genuine detach.

What's missing is a _value kind_ that says "this attribute tracks an activity": today an activity value reaches an attr slot only as a snapshot at render time; keeping it live requires either widening an effect boundary around the element (subtree re-render per update) or a manual `watch` (`narrow-docs-effect-boundaries`' escape hatch, whose design D1 names this primitive as the fix).

Constraints: `get-attr-update.ts` is the update hot path for every dynamic node; core is size-tracked; the file has an open 🟡 OCP audit entry (switch dispatch) that this change must not worsen.

## Goals / Non-Goals

**Goals:**

- Declarative per-attribute reactivity: `attr=${activity.bind(select)}` applies immediately and stays in sync without re-rendering the component.
- Automatic cleanup: binding subscriptions ride `ctx.teardowns` (unmount) and are swapped safely on re-render (no stacking, no stale bindings).
- Works for standard attributes and for values inside `$attrs` objects.

**Non-Goals:**

- Bindings for `$on` handlers, `$props`, or component-tag props (element syntax passes those as props; a binding object there is simply not interpreted, like any other non-attr value today).
- Two-way binding, or binding multiple activities into one attribute (compose upstream: derive a single activity if needed).
- Resolving the file's OCP audit entry (dispatch-map refactor) — additions conform to the existing structure; the entry stays open.

## Decisions

**D1 — `bind` lives on the activity; the binding is a plain marker object.** `activity(...).bind(select?)` returns `{ [ATTR_BINDING]: true, value, watch, select }` — `ATTR_BINDING` being an internal `Symbol` property so no user object can collide with it. Alternatives: a `$bind` special attr (obscures _which_ activity per attr and fights the one-value-per-slot grammar) and reusing `effect` (its contract is content contexts; overloading it to mean "attribute subscription" muddies both). `select` defaults to identity; its return feeds the existing updater exactly as a plain value would (strings, `StyleProp`s, etc.).

**D2 — Recognition happens inside the updaters, once per slot kind.** `getStandardAttrUpdate`'s updater and the `$attrs` updater's per-entry loop gain a check: if the incoming value is an `AttrBinding`, delegate to `applyAttrBinding(applyValue, binding, valueCtx)` — a small helper that (1) disposes the slot's previous binding subscription if any, (2) applies `select(binding.value())` synchronously via the updater's own value path, (3) subscribes `binding.watch` so each activity update re-runs step 2's application with the new projected value, and (4) registers the unsubscriber for teardown and in a per-slot record for swap disposal. Non-binding values keep today's exact path with one added constant-time type check. Implementation discovery: the slot child context (`valueCtx`) cannot host the teardown — `appendChildContext` returns `undefined` for plain-object values (bindings) and would be transient anyway. Instead, `setUpdatesForPaths` threads the **host component context** into `getAttrUpdate`, and the unsubscriber registers on `hostCtx.teardowns` — the teardown cascade root for the component, which is exactly when the binding must die. Swap disposal also deletes the stale unsubscriber from `hostCtx.teardowns` so re-render-heavy components don't accumulate dead entries.

**D3 — Swap semantics: last write wins, previous subscription always disposed.** The per-slot record (keyed on the updater closure, which is already per-element-per-attr) stores the active unsubscriber. A re-render delivering a new binding disposes the old subscription before subscribing anew; a re-render delivering a plain value disposes and falls through to the standard path. This guarantees at most one live subscription per attr slot at any time — the no-stacking property, pinned by spec.

**D4 — Cleanup is teardown-first, swap-second.** The unsubscriber registered in `ctx.teardowns` covers unmount; the slot record covers replacement while mounted. Both call the same idempotent `Unsubscriber`, so double-disposal is safe by `reactive-unsubscribe`'s contract. No new lifecycle machinery.

**D5 — The docs TOC migrates in this change (amended after task 1.2).** Verified: the `className` prop chain runs through `classNames()` in both `DocContainer` and `PinkContainer`, which stringifies any binding object — the prop pass-through path is not viable. Fallback adopted: `DocsLayout` binds the **layout root's** own `class` attr (`class=${topicTocToggle.bind((isOpen) => classNames(className, 'u-flex', { [styles._open]: isOpen }))}`) — an element its template owns directly — and the CSS module re-targets the `_open` rules from `.docContainer._open` to the descendant form `._open .docContainer`, with no DOM structure change. The mount-scoped watch and `querySelector` are removed.

## Risks / Trade-offs

- [Hot-path type check on every attr update] → One symbol-property test per update; measured via the usual bundle/size pass and the suite's timing.
- [Binding objects leaking into non-attr positions (component props, text slots)] → They are inert objects there; text slots would stringify. Documented; a debug-mode warning is a possible follow-up, not in scope.
- [Prop pass-through chains (D5) may stringify or clone the binding] → Verified up front (task 1.2); design amended if the docs migration needs the fallback shape.
- [The OCP audit entry on `get-attr-update.ts` remains open while the file grows] → Additions are localized in two updaters + one helper; the entry's recommended dispatch-map refactor remains the right future fix and is untouched.
