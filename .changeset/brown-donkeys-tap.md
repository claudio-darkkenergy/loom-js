---
'@loom-js/core': patch
---

Remove leftover debug `console.log` calls from custom element registration.

`registerCustomElement` logged the resolved props on every custom element
instantiation, and logged the mounted context again after mount — noise that
reached consumer consoles in the published build. Both are gone.

Also corrects the prop type passed to the component function during custom
element instantiation (`ComponentInputProps` rather than the resolved
`ComponentProps`). Type-level only; the value passed at runtime is unchanged.
