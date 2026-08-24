# Design: Dedupe Route CSS Loading

## Context

esbuild with `splitting: true` splits JS only. The metafile for a build like `apps/loom`'s looks like:

- `static/js/spa.js` — output with `entryPoint` set and `cssBundle: build/static/js/spa.css`. That CSS bundle contains **every** CSS input reachable from the entry, including `src/app/pages/docs/styles.module.css` and other CSS reached only through `import('@/app/pages/docs/')`.
- `docs-*.js` / `pages-*.js` — dynamic route chunks, each with its own `cssBundle` (`docs-*.css`, `pages-*.css`) repeating the CSS its subgraph imports. **Note (found during apply):** esbuild marks these outputs with `entryPoint` too (dynamic imports become sub-entry points in the metafile), so `entryPoint` absence cannot identify them; what does identify them is being the target of a `kind: 'dynamic-import'` edge in another output's `imports`.
- `static/styles/base.css` — a genuine CSS entry point (`entryPoint` set on the CSS output itself).

`esbuild-plugin-html-split` currently classifies every `.css` output into the template args (`css` if the output has `entryPoint`, `common.css` otherwise), so shells link `spa.css` **and** the route CSS bundles. Verified in `apps/loom/build`: `styles_docContainer` rules exist in both `spa.css` and `docs-*.css`, and both are linked from `index.html` and `docs/index.html` — every route-level rule applies twice. The dev superset shell and the prod scoped shell (`template.html.mts` keeps `spa.css` because it has no route-scope prefix) both hit this.

Constraint: this must not regress the `app-asset-delivery` spec (route shells must not reference another route's chunks) and must work for both the SPA mode and the multi-entry mode of the plugin.

## Goals / Non-Goals

**Goals:**

- Each CSS rule reaches the browser through exactly one linked stylesheet, in dev and prod.
- Metafile-driven detection — no filename conventions, works for any consumer of the plugin.
- Fewer total CSS bytes fetched per shell (route CSS files stop being fetched).

**Non-Goals:**

- True route-scoped CSS delivery (entry stylesheet containing only shared CSS). esbuild cannot split CSS today; subtracting route CSS from the entry bundle post-build would require byte-slicing minified output and is too brittle. Revisit when esbuild ships CSS code splitting (esbuild#608). The route CSS in play is ~8KB versus ~280KB of shared CSS, so the win forgone is negligible.
- Changing how esbuild emits CSS (the redundant `docs-*.css` files still land in `build/`; they are simply never linked or fetched).
- Reworking JS scoping in `template.html.mts` — JS route scoping stays as is.

## Decisions

### 1. Fix in the plugin, not the app template

The duplication is a classification bug in `esbuild-plugin-html-split`: it treats a dynamic chunk's `cssBundle` as a shared stylesheet. Fixing it there fixes every consumer (loom, sandbox, future apps) and keeps `template.html.mts` dumb. Alternative — filtering in the app template — was rejected because the template only sees resource paths, so it would need fragile name matching, per app.

### 2. Identify redundant CSS via `cssBundle` on dynamically-imported JS outputs

In `onEnd`, before classifying outputs, collect the output paths that appear as `kind: 'dynamic-import'` targets in any output's `imports`, then build a set of those outputs' `cssBundle` values. (Originally specified as "JS outputs with no `entryPoint`", but esbuild sets `entryPoint` on dynamic-import chunks too — verified against the loom metafile during apply — so the dynamic-import edge is the discriminating signal.) Any CSS output in that set is skipped entirely (not pushed to `css` or `common.css`). Everything else keeps its current classification:

- `spa.css` — the entry's `cssBundle`, not in the skip set → still linked (as `common.css`, unchanged).
- `base.css` — CSS entry point, has its own `entryPoint` → still linked (as `css`, unchanged).
- `docs-*.css`, `pages-*.css` — `cssBundle` of dynamically-imported chunks → skipped.

Alternative considered: link route CSS and drop `spa.css`. Rejected — the entry bundle also holds shared CSS (pink.css, icon fonts) that exists nowhere else.

Alternative considered: dedupe by comparing CSS inputs across bundles. Rejected — more code for the same result; the `cssBundle`-of-non-entry-chunk relationship already states the containment guarantee directly.

### 3. Multi-entry (non-SPA) mode gets the same rule

In the plugin's multi-entry branch, each entry's CSS bundle already contains everything its graph reaches, so skipping dynamic chunks' `cssBundle`s is equally correct there.

### 4. Narrow `template.html.mts` scope filtering to JS

After the plugin change, no route-scoped CSS paths reach the template, so the CSS branch of `includeResource` is dead. Apply the filter to JS only and drop the CSS filter call, with a comment explaining that CSS arrives pre-deduped/unscoped from the plugin. This keeps the file honest rather than carrying dead logic.

## Risks / Trade-offs

- [esbuild changes `cssBundle` semantics in a future version] → The detection reads only documented metafile fields (`entryPoint`, `cssBundle`); a behavior change would surface immediately as a missing stylesheet in dev. The verification scenario (rule appears exactly once) catches both duplication and over-removal.
- [A future consumer wants real per-route CSS] → Non-goal documented here; the plugin change is additive-in-spirit (skips redundant links) and can be replaced wholesale when esbuild supports CSS splitting.
- [Stale `build/` output confuses verification] → Tasks verify against a fresh `pnpm -F @loom-js/loom build` (and a dev-server pass), not existing artifacts.

## Open Questions

_None._
