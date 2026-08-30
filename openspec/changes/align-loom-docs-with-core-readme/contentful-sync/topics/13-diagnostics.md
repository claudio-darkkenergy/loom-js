---
slug: diagnostics
title: Diagnostics
---
## Two lanes

Loom's console surface (`loom.console`, backed by the framework's `loomConsole`) has two lanes:

- **Warnings & errors always surface** — in development & production alike, with no opt-in. Attr misuse, unregistered custom elements, & settlement `maxWait` expiries reach the native console unconditionally.
- **Everything else is opt-in debug narration**, silent by default. Enable it with `setDebug(isOn, scopes)` (or `globalConfig.debug`/`globalConfig.debugScope` at boot) in a non-production build.

**Inclusion** `import { setDebug } from '@loom-js/core';`

## setDebug and scopes

`setDebug(isOn, scopes)` switches debug narration on for a set of scopes: `activity`, `creation`, `mutations`, `updates` — each call site is gated by exactly one scope, & hot-path narration (render/mount/mutation/update cycles) folds into collapsed console groups.

The boot-time equivalents are `globalConfig.debug` and `globalConfig.debugScope` on `init`/`hydrate` — see [Configuration](/docs/configuration).

## Semantics worth knowing

- **Attribution is real:** accessing a `loom.console` method returns the native console method bound to the console (or a shared no-op when its gate is closed) — never a wrapper — so the browser attributes each message to the framework call site that produced it.
- **The gate is read at property access:** `loom.console.info(…)` reflects the debug state at that access. Don't cache a method reference (`const log = loom.console.info`) — it freezes the gate state it was read under.
