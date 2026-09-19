# Two-Pass Full Minify

## Why

`route-scoped-css-delivery` had to turn identifier minification off in the loom app's prod build: the plugin's nested CSS rewrites and the prerender bundle must emit the exact css-module class names the JS carries, and esbuild assigns minified local names per build. The workaround costs a measured +37 KB raw / +4.2 KB gzipped (~10%) across the app's JS. The archived design records the fix: make one build produce every artifact, so one mangle pool names everything.

## What Changes

- `esbuild-plugin-html-split` gains an opt-in **two-pass mode**: pass 1 builds normally and yields the metafile for shared/owned CSS analysis; pass 2 reruns the same build once with the synthetic shared-entry and per-route CSS entries added as extra entry points, so JS, entry CSS, route CSS, and the prerender bundle are all named from a single mangle pool. Pass-2 outputs win; HTML emission uses pass-2's metafile.
- A re-entrancy guard keeps the plugin from recursing inside pass 2.
- The mode is opt-in and intended prod-only — it roughly doubles build time; single-pass behavior is unchanged for everyone else.
- `apps/loom` restores `minify: isProd`, opts into two-pass for prod builds, and drops the stable-names constraint comment — reclaiming the +4.2 KB gzip.

## Capabilities

### New Capabilities

_None — this is a build-pipeline optimization; no framework capability changes._

### Modified Capabilities

- `app-asset-delivery`: the production-output requirement gains full identifier minification alongside the existing shared-only/no-duplication CSS guarantees (names consistent between JS and stylesheets).

## Impact

- `packages/esbuild/esbuild-plugin-html-split` — two-pass orchestration in `html-split.mts`/`route-css.mts`; new plugin option.
- `apps/loom/project/client/config.mts` — `minify: isProd` restored; plugin opt-in wired.
- No `@loom-js/core` changes. Build time for loom prod roughly doubles (opt-in cost, accepted).
- Verification depends on the archived `route-scoped-css-delivery` audits, repeated under full minify.
