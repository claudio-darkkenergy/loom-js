---
'@loom-js/core': minor
---

Server rendering works under spec-strict DOM implementations — the supply-a-window contract is now continuously verified against linkedom, jsdom, and Happy DOM:

- Attribute names read from `Attr.name` (the spec accessor), fixing the empty-name `setAttribute` that Happy DOM rejected with `InvalidCharacterError`.
- Slot wiring checks node kinds via realm-free `nodeType`, so imported nodes that keep a foreign class realm still wire their updates.
- Templates now parse per document (the compile plan stays shared), which lifts the one-DOM-implementation-per-process rule entirely — any number of windows, of one implementation or several, can render in one process — and stops the template cache from pinning the first render's document.
- The `url` render option registers the request location through the provider seam, so route matching works even where `window.location` is unforgeable (jsdom). App code reading `window.location` directly under jsdom still sees jsdom's own — pass `url` to `new JSDOM(html, { url })` if that matters.
