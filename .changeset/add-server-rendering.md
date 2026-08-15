---
'@loom-js/core': minor
---

Server rendering: new `@loom-js/core/server` entry with `renderToString(app, { window, url })` — renders a loom app to an HTML string outside the browser (SSR at request time, SSG/prerender at build time) through the exact same render path the client runs, against a caller-supplied DOM (e.g. a linkedom `parseHTML` window). loom takes no new dependency; the browser bundle is untouched.

**How it works**: rendering now resolves `window`/`document` (and every `instanceof`-checked DOM constructor) through a render-scoped provider (`src/lib/dom.ts`) that defaults to the real `window` in browsers — no client behavior change, benchmark-verified no measurable cost. `renderToString` swaps the provider for the synchronous duration of a render, making concurrent server renders isolated by construction. The injected window is normalized for linkedom's gaps (`NodeFilter` constants, a plain-object `location` built from `url`, a `history` shim).

**Server semantics**: `onCreated`/`onBeforeRender`/`onRendered` fire as usual; `onMounted`/`onUnmounted` never fire server-side. `defineElement` registrations are applied to each injected window automatically. Per-render lifecycle registrations are released after serialization, so long-running SSR processes don't accumulate.

**Also fixed along the way**: importing `@loom-js/core` without a browser no longer crashes (router/routing/config touched `window` at module load — they now initialize lazily), and cached template fragments are re-cloned via `importNode` so custom elements upgrade correctly in whichever document is rendering.
