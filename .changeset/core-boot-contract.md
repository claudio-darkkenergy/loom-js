---
'@loom-js/core': minor
---

The shell boot contract is a core export. `APP_ROOT_ID`, `STATE_SCRIPT_ID`, `appRootSlot` and `stateScriptSlot` (browser entry) name the app-root and state-script elements a shell emits and the client boot reads; `injectPrerender` (server entry) fills both slots with a prerendered route's markup and `serializeState` output, and throws when a slot is missing. Shell templates, prerender injectors and the client boot agree on the slots without sharing app code — `@loom-js/build` uses them for its default shell and prerender phase.
