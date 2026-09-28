---
'@loom-js/core': minor
---

**BREAKING** — the `<>` fragment token is removed. A template's root form is now read from its parsed top level: exactly one element (whitespace-only text ignored) is a single root; anything else — several elements, text, a comment, or an interpolated value — is a fragment.

- A template that wrapped one element in `<>` is now single-rooted: `node()` and life-cycle handlers receive the element, not a one-item array.
- A lone top-level interpolation (`` html`${Child()}` ``) now renders its value; it used to render nothing.
- Fixes `&lt;&gt;` leaking into server output for whitespace-led fragment templates under linkedom.

Types: component callables with required props are accepted in the tag position (`<${Card} heading="…" />`) for `component`, `simple`, and plain functions; `AttrsTemplateTagValue` entries accept `bind()` values.
