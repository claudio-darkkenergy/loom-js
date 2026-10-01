---
'@loom-js/pink': minor
---

Add `PinkCodePanel.Tabs`, a tab strip for the code panel header that switches between variants of the same code (e.g. npm/yarn/pnpm). It renders `<button role="tab">` items on pink's `.tabs` classes and follows a `selection` activity in place — panels sharing one activity switch together. `resolveCodePanelTab` gives the label a panel shows for a selection, falling back to the first tab. `PinkCodePanel.CopyButton` now also takes `text` as a getter, so it can copy the active variant at click time. The new `@loom-js/pink/styles/code-panel-tabs.css` sizes the strip to the header. Panels without tabs are unchanged.
