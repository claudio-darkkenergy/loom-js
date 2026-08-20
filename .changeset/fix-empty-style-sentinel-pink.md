---
'@loom-js/pink': patch
---

`PinkButton` drops its conditional style-omission workaround and passes its custom-property style array through unconditionally — `@loom-js/core` now guarantees an empty-resolving style value leaves no `style` attribute behind. No API change.
