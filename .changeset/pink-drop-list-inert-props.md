---
'@loom-js/pink': minor
---

**BREAKING**: `PinkDropList` drops the `arrow`, `isBlockEnd` and `isInlineEnd` props and the `DropListArrow` enum. They were declared but never rendered — the classes they named belong to pink's `.drop` popover, which the component does not render — so nothing that used them changes appearance; remove the props.
