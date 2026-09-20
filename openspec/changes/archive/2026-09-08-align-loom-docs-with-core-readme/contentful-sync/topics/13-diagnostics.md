---
slug: diagnostics
title: Diagnostics
---
When loom has something to say, it says it through one console surface with predictable rules. This topic covers what always surfaces, what's opt-in, the shape every line shares, and the switches controlling it.

## Two lanes

Loom's console surface (the framework-internal `loomConsole`) has two lanes:

- **Warnings & errors always surface** — in development & production alike, with no opt-in. Attr misuse, unregistered custom elements, & settlement `maxWait` expiries reach the native console unconditionally.
- **Everything else is opt-in debug narration**, silent by default. Enable it with `setDebug(isOn, scopes)` (or `globalConfig.debug`/`globalConfig.debugScope` at boot) in a non-production build — or at runtime from the devtools console via the `loom` global: `loom.setDebug(true, { updates: true })`.

**Inclusion** `import { setDebug } from '@loom-js/core';`

## The line anatomy

Every loom console line carries one scannable shape: the `[loom]` badge, the scope/lane tag, the _subject_ (which activity, component, element, or resource key the line concerns), the event, & the detail — styled in browsers that support console styling, the same segments as plain text in server consoles:

```
[loom] activity ⟨search⟩ dropped commit — the run was retired (superseded or timed out)
```

Always-on warnings end with one more clause: the remedy, or the docs concept that resolves the problem — "pass `maxWait: Infinity` to disable the bound", "see Dehydrated state: serializability boundary" — so a warning names the fix, not just the symptom.

## Naming subjects with label

An activity's opt-in `label` option names it in every diagnostic that references it:

```ts
const search = activity('', {
    label: 'search',
    transform: async ({ input, signal, update }) => {
        update(await fetchResults(input, signal));
    }
});
```

Narration lines, dropped-commit & timeout notices, & the pending enumeration all show `⟨search⟩`. Labels are purely diagnostic & never affect behavior. Unlabeled activities fall back to a stable generated tag (`activity#3`) so lines from different sources stay distinguishable; other subject kinds reuse what already identifies them — component keys, tag names, resource keys.

Bounded settlement warnings put labels to work: a `maxWait`-class expiry (`hydrate`, `renderToString`) enumerates the labeled subjects still pending alongside the count — `3 pending — ⟨page-content⟩, ⟨search⟩, activity#7` — capped, with the overflow counted.

## setDebug and scopes

`setDebug(isOn, scopes)` switches debug narration on for a set of scopes: `activity`, `creation`, `mutations`, `updates` — each call site is gated by exactly one scope, & hot-path narration (render/mount/mutation/update cycles) folds into collapsed console groups.

The boot-time equivalents are `globalConfig.debug` and `globalConfig.debugScope` on `init`/`hydrate` — see [Configuration](/docs/configuration).

## Semantics worth knowing

- **Attribution is real:** each framework console access resolves to the native console method bound to the console (or a shared no-op when its gate is closed) — never a wrapper — so the browser attributes each message to the framework call site that produced it. Styling composes _arguments_ for that bound method; it never wraps it.
- **The gate is read at property access:** every narration call reflects the debug state at that moment — flipping `loom.setDebug` applies from the very next message, no reload needed.
