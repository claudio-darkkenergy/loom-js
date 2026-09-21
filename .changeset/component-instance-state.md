---
'@loom-js/core': minor
---

Component instance state: the render function's props gain the `own` utility — `const isOpen = own(() => activity(false))` invokes the factory on the instance's first render and returns the cached value on every re-render, so locally created state survives parent-triggered re-renders. Values replay by call order (the rule `createRef` already follows — call unconditionally, in the same order, every render; a mismatched call count gets a debug-lane warning), live exactly as long as the component instance (released on unmount, isolated per instance and per server window), and disposal of stored resources stays the author's via `onUnmounted`.
