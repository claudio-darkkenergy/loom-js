---
slug: diagnostics
title: Diagnostics
---
When loom has something to say, it says it through one console surface with predictable rules. This topic covers what always surfaces, what's opt-in, and the switches controlling it.

## Two lanes

Loom's console surface (the framework-internal `loomConsole`) has two lanes:

- **Warnings & errors always surface** — in development & production alike, with no opt-in. Attr misuse, unregistered custom elements, & settlement `maxWait` expiries reach the native console unconditionally.
- **Everything else is opt-in debug narration**, silent by default. Enable it with `setDebug(isOn, scopes)` (or `globalConfig.debug`/`globalConfig.debugScope` at boot) in a non-production build — or at runtime from the devtools console via the `loom` global: `loom.setDebug(true, { updates: true })`.

**Inclusion** `import { setDebug } from '@loom-js/core';`

## setDebug and scopes

`setDebug(isOn, scopes)` switches debug narration on for a set of scopes: `activity`, `creation`, `mutations`, `updates` — each call site is gated by exactly one scope, & hot-path narration (render/mount/mutation/update cycles) folds into collapsed console groups.

The boot-time equivalents are `globalConfig.debug` and `globalConfig.debugScope` on `init`/`hydrate` — see [Configuration](/docs/configuration).

## Semantics worth knowing

- **Attribution is real:** each framework console access resolves to the native console method bound to the console (or a shared no-op when its gate is closed) — never a wrapper — so the browser attributes each message to the framework call site that produced it.
- **The gate is read at property access:** every narration call reflects the debug state at that moment — flipping `loom.setDebug` applies from the very next message, no reload needed.
