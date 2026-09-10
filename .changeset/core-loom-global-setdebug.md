---
'@loom-js/core': minor
---

Debug narration is now switchable at runtime and `setDebug` is fixed. The `loom` global now exposes `setDebug` and no longer exposes the console proxy (it was consumer-unusable — the access-time gate made cached references stale, and nothing needs the handle now that `setDebug` is reachable) (`loom.setDebug({ updates: true })` from a devtools console). `setDebug` itself no longer `Object.assign`s onto a primitive `false` (which produced a truthy Boolean-wrapper debug state that could never be switched off) and no longer mutates the shared scope defaults: `setDebug(false)` turns everything off, `setDebug(true)` enables the full scope set, an explicit scope record becomes the active set exactly (unlisted scopes off), and a scopes-first call implies enabling. `setDebug` always returns the whole resulting scope record — every scope explicitly on or off — for enables, scope changes, and `setDebug(false)` alike.
