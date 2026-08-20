# add-lint-plugin

## Why

Element syntax became loom's primary authoring surface (`element-syntax-first` / `element-syntax-conversion`), but nothing enforces the convention for consuming teams — and the umbrella change cannot archive until its last open task (5.1, the lint-plugin package) lands. The umbrella's Decision 3 already settled the shape: enforcement ships as an installable lint package — eslint rules as **enforcers, not codemods** (no external users exist; in-repo migration was done by hand) — while the repository itself stays prettier-only.

## What Changes

- **New workspace package** at `packages/eslint/eslint-plugin`, published as `@loom-js/eslint-plugin` following the `esbuild-plugin-html-split` model: `private: true` + `publishConfig.access: public`, source exports, versioned via changesets.
- **An eslint 9 flat-config plugin** exporting the rules and a `recommended` config. v1 rules:
    - `prefer-element-syntax` — a direct `${Component({ … })}` call interpolation inside a loom `html` tagged template, where a component tag serves, is reported. Sanctioned value positions are spared: callback returns, `.map`/array items, `is=` props, props transformers — anywhere a component travels as a JS value.
    - `no-dollar-props-on-component-tags` — a `$`-prefixed attribute on a `<${Component}` tag (which throws at first render) is reported at lint time instead.
    - A `no-tags-import` rule was considered and descoped during apply: `@loom-js/tags` has no external users, so the owner-side `npm deprecate` is the native enforcement surface — a lint rule would guard against a package nobody consumes.
- **A GritQL pattern for Biome** shipped in the package as a lint-only courtesy, mirroring the textually-expressible rule, without parity promises (umbrella Decision 3).
- **Deferred, documented**: the two array-composition constraints (regions interpolate, never as array items; array-consumed components stay off component-tag roots) need cross-file/flow analysis that eslint rules can't do honestly in v1.
- **Repo wiring**: `packages/eslint/*` workspace glob, `.prettierrc` `packageJSONFiles` entry (per the CLAUDE.md corollary — without it the new package's deps sort into the wrong import group), `skill-config.md` update, umbrella task 5.1 checked.
- The repo does **not** adopt the plugin for its own sources — prettier-only stands.

## Capabilities

### New Capabilities

- `element-syntax-linting`: the installable enforcement package's obligations — which patterns each rule reports and spares, the flat-config surface, and the lint-only Biome mirror. (The policy-level requirement — enforcement is installable, not imposed — already lives in the umbrella's `element-syntax-authoring` draft and lands with its archive; this capability owns the plugin's concrete behavior.)

### Modified Capabilities

_None — no existing main spec's requirements change._

## Impact

- New: `packages/eslint/eslint-plugin/` (rules, flat config, GritQL pattern, tests, README).
- Modified: `pnpm-workspace.yaml`, `.prettierrc`, `.claude/skills/skill-config.md`, `openspec/changes/element-syntax-first/tasks.md` (5.1 checked).
- Tests: `node --test` + eslint `RuleTester`, mirroring how core's server tests run.
- Release: one changeset for the new package; the publish workflow picks it up via changesets as usual.
- No runtime packages touched; `@loom-js/core` is unaffected.
