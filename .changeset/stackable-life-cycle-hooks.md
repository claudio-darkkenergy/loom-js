---
'@loom-js/core': minor
---

Life-cycle handlers stack. Every `onCreated` / `onBeforeRender` / `onRendered` / `onMounted` / `onUnmounted` call during a component's render appends to that event's handler list, and the event runs the list in registration order — a component and the hooks it calls can each register for the same event; previously only the first registration took and the rest were silently dropped. The list locks once the render that filled it ends, exactly as the single handler did (re-render calls stay no-ops; a remount's render registers afresh). Handlers given through a `ref` run after the component's own — a child whose parent registered a ref handler for an event used to lose its own handler for that event; both now fire, child first.
