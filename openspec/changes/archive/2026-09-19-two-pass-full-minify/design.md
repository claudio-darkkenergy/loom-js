# Design: Two-Pass Full Minify

## Context

Under full `minify`, esbuild assigns css-module local names from a per-build frequency pool — two builds of the same sources produce different short names (verified empirically during `route-scoped-css-delivery`). Within a single build, a module's names are consistent across every output. Today the plugin runs nested `esbuild.build` calls after the parent build to rewrite the entry and route CSS bundles; those are separate builds, which forced identifier minification off (`minifyWhitespace`/`minifySyntax` only) so names take the deterministic `stem_name` form.

## Goals / Non-Goals

**Goals:**

- Full identifier minification in loom's prod output with css-module names consistent across JS, entry CSS, route CSS bundles, and the prerender bundle.
- Opt-in: single-pass behavior byte-identical for plugins users who don't enable it.
- One flag flip to roll back (disable the option, restore the granular minify settings).

**Non-Goals:**

- Speeding up the double build (caching, incremental) — accepted cost, prod-only.
- Changing the ownership analysis, manifest shape, or core's `assets` contract — pass 2 reuses them as-is.

## Decisions

### 1. Option shape: `twoPassCss?: boolean` on the plugin

Named for what it does to the build, not the minify setting it enables — the plugin never touches `minify` itself; the app owns its own flags. Default `false`.

### 2. Pass structure: analyze in pass 1, re-enter esbuild once with extra CSS entries

Pass 1 is the app's normal build; `onEnd` runs the existing analysis (import-graph ownership, shared/owned input sets). With `twoPassCss` on, instead of nested per-bundle rewrites, the plugin writes the synthetic `@import` entries (shared + one per route) and calls `esbuild.build` once with the parent's `initialOptions` plus those entries appended to `entryPoints`, with this plugin replaced by a pass-2 marker plugin. Every output re-emits from one mangle pool; the synthetic CSS outputs land at the exact paths the shells and manifest already reference (`entryNames` pinning, as the current rewrite does). HTML emission and the manifest read pass 2's metafile.

### 3. Re-entrancy guard: pass 2 runs without the html-split plugin

The pass-2 build gets the parent's plugin list minus `html-split` (matched by plugin name), so nothing recurses and no HTML is emitted mid-pass. The clean/copy plugins are also dropped — pass 2 must not wipe the outdir it is overwriting into.

### 4. Naming consistency is asserted, not assumed

The verification step greps a css-module selector out of an emitted route stylesheet and requires the identical string in the corresponding JS chunk — the invariant that motivated the whole change, checked mechanically on every audit.

## Risks / Trade-offs

- [~2x prod build time] → opt-in, loom accepts it; dev builds never take pass 2.
- [Pass-2 outputs drift from pass-1 analysis if inputs change between passes] → passes run back-to-back in one process over the same files; the audit (names match, entry shared-only) catches any drift loudly.
- [Dropped plugins in pass 2 skip side effects (copy assets)] → pass 1 already produced them; pass 2 only re-emits bundle outputs.
- [Rollback] → disable `twoPassCss` and restore `minifySyntax`/`minifyWhitespace` in the app config — the prior, verified state.
