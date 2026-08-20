---
'@loom-js/core': minor
---

Style bindings now apply by replacement: an object or array `style=` value (attr slot or `$attrs` entry) fully determines the element's inline style on each application, and a value resolving to zero properties removes the `style` attribute entirely — the template placeholder token can no longer leak into the DOM through an empty-resolving style value. Behavior change: a re-render whose new style value drops a property now removes that property from the element (previously it stayed applied), aligning object/array values with the string value's existing replace semantics. Entries within a single array value still merge in order.
