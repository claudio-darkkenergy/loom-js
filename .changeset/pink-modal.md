---
'@loom-js/pink': minor
---

New `PinkModal`: Pink Design's modal as a loom component over a native `<dialog>` — a header with the title, an optional `description` and a close button, a `headerStart` slot before the title (pink's avatar spot), a content region, an optional footer, `isSeparateHeader`, and the `small` / `big` / `huge` size presets. `isOpen` drives `showModal()` / `close()`; `closeOnEscape` (default on) and `closeOnOutsideClick` (default off) pick the close paths, and every close reports through `onClose`. Opening focuses an `autofocus` element, else the first control in the content, else the footer's first button.
