# Design — server-dom-compat

## Context

Templates cache per chunks identity against the first document (`html-parser.ts`: cached fragment + `importNode` into the current document). The verification matrix (now `tests/server/render-to-string*.test.mjs`) surfaced four distinct defects, two of them found only after the matrix ran as real tests:

- **F1 — empty attribute name (the original red):** loom read `Attr.nodeName` throughout attr application; Happy DOM's `Attr` returns `''` for `nodeName` (only `name` carries the qualified name), so every dynamic attribute became `setAttribute('', …)` — `InvalidCharacterError` under spec-strict validation.
- **F2 — realm-bound slot checks:** Happy DOM's `importNode` keeps the source window's class realm, so `dynamicNode instanceof getWindow().Text` failed for imported nodes and slot updates silently never wired (second window rendered raw `⚡` placeholders).
- **F3 — first-document template cache:** the cached fragment belongs to whichever document parsed first. Cross-window `importNode` clones then carry a foreign realm — under Happy DOM, custom elements in a second window never upgrade — and the cached fragments pin the first render's document for the life of the process (a real server leak). The old "one implementation per process" rule was this same defect observed cross-implementation.
- **F4 — unforgeable `location`:** jsdom implements `window.location` spec-correctly as [LegacyUnforgeable]; `normalizeWindow`'s plain assignment silently no-ops, so the `url` option renders `path: blank` markup with no signal.

## Goals / Non-Goals

**Goals:** the supply-a-window contract true without caveats — the matrix green under linkedom, jsdom, and Happy DOM, custom elements and multiple windows per process included; the `url` option effective under every implementation; no reliance on lenient validation or shared class realms.

**Non-Goals:** chasing emulator quirks beyond what the matrix exercises; performance claims about jsdom; guaranteeing direct `window.location` reads in app code reflect `url` under an unforgeable implementation (loom's own routing APIs are the contract).

## Decisions

### D1 — Attribute names read from `Attr.name`, never `Attr.nodeName`

`name` is the spec's canonical accessor for an attribute's qualified name; Happy DOM's `nodeName` is empty. All reads in `get-attr-update.ts` switched. No guard — the empty name is never produced. **Implemented.**

### D2 — The matrix is the same tests, parameterized

`tests/server/support/render-suite.mjs` holds the render scenarios, parameterized by window factory; one thin `*.test.mjs` entry per implementation (node's test runner isolates files in separate processes, which also keeps the red/green attribution per implementation obvious). The suite pins the reproducer (custom element with a `$`-prefixed interpolated prop). **Implemented.**

### D3 — Template cache is per (chunks, document)

Reverses the old per-process non-goal — F3 showed the first-document cache is a correctness bug under per-window realms and a document leak on servers. `templateCacheStore` becomes `Map<chunks, { plan, docCache: WeakMap<Document, { fragment, paths } > }>`: the compile plan stays chunks-keyed (string work, realm-free); the parsed fragment and its `paths` (which hold `Attr` references into that fragment) live per document, parsed on that document the first time it renders the template. In the browser there is one document ever, so the fast path is the same single lookup. The `WeakMap` releases a server window's fragments with the window. `importNode` remains for the per-document clone-per-instance step. This deletes the one-implementation-per-process rule — mixed implementations in one process become supported and matrix-tested.

### D4 — Injected location resolves through the provider seam

`window.location` cannot be replaced on a spec-unforgeable implementation, so installation onto the window is best-effort, and loom's own reads stop depending on it: `lib/dom.ts` gains `getLocation()` — a per-window override (WeakMap, registered by `normalizeWindow` from the `url` option) falling back to `win.location`. Router/location reads and the history shim's navigation mutations go through the same override object. The `url` option then behaves identically under all three implementations; app code reading `window.location` directly under jsdom sees jsdom's own (documented boundary — pass `url` at `new JSDOM(html, { url })` if that matters).

### D5 — Slot-node kind checks are realm-free

`nodeType` literals (`TEXT_NODE`/`COMMENT_NODE`) replace `instanceof getWindow().Text/Comment` in slot wiring — `nodeType` is identical across realms. **Implemented** for the wiring path the matrix exercises; remaining `instanceof getWindow().*` sites are left alone until a matrix scenario demands otherwise.

## Risks / Trade-offs

- [jsdom/happy-dom weight in devDeps] → test-only, core's `devDependencies`; published package unaffected.
- [Emulator updates break the matrix] → that's the point — the claim stays continuously true or fails loudly.
- [D3 touches the hot template path] → browser fast path is structurally the same lookup; the full browser suite gates it.
- [D4 leaves `window.location` un-synced under jsdom] → loom APIs are the routing contract; boundary documented.

## Migration Plan

Minor release (lifts the documented one-per-process restriction; `url` contract becomes uniform). Docs updated in the same change: verified matrix, one-per-process rule deleted, jsdom `url` note.

## Open Questions

None.
