# add-lint-plugin — design

## Context

Umbrella Decision 3 (`element-syntax-first`) fixed the policy: enforcement of the element-syntax authoring convention ships as an installable lint package — eslint rules as enforcers (not codemods), a GritQL mirror for Biome as lint-only courtesy — while the repo itself stays prettier-only. The conversion change proved out the convention's concrete rules (element syntax primary; functional form reserved for value positions; `$` props are element-only). What remains is the package itself.

Constraints: the repo's publish model (changesets; `private: true` + `publishConfig.access: public`); `lib/typescript-config` as the shared tsconfig base; every workspace pins `typescript ^7`; new workspaces must be added to `.prettierrc`'s `packageJSONFiles` or their deps sort into the wrong import group.

## Goals / Non-Goals

**Goals:**

- An installable `@loom-js/eslint-plugin` with eslint 9 flat-config support and a `recommended` config.
- Three v1 rules that report the unambiguous convention violations: `no-tags-import`, `prefer-element-syntax`, `no-dollar-props-on-component-tags`.
- A GritQL mirror of the textually-expressible rules.
- Tests in the repo's existing style (`node --test` against built output, like core's server tests).

**Non-Goals:**

- No autofixes/codemods — enforcers only (umbrella Decision 3).
- No enforcement of the two array-composition constraints (regions interpolate, never as array items; array-consumed components stay off component-tag roots) — both need flow/cross-file analysis a syntactic rule can't do honestly; deferred with the limitation documented in the README.
- No self-wiring: the repo's own sources are not linted by this plugin — prettier-only stands.
- No GritQL parity promise — patterns mirror what GritQL can express textually; gaps are documented, not papered over.

## Decisions

### D1 — Compiled `dist/`, not source exports (the one divergence from the esbuild-plugin model)

`esbuild-plugin-html-split` exports raw `.mts` source because its consumers are build scripts already running under `tsx`/`ts-node`. An eslint plugin is loaded by eslint itself under plain Node, so source exports don't work here. The package follows the esbuild plugin's _publishing_ model (`private: true` + `publishConfig.access: public`, changesets) but compiles: authored in TypeScript, `build-package` runs `tsc` to `dist/` (ESM, `type: "module"`, declaration files), `exports` points at `dist/index.js`. Plain `tsc` — no rollup; a lint plugin needs no bundling or treeshake annotations. `eslint >= 9` is a peerDependency (flat config only); eslint is also a devDependency for tests.

### D2 — Plugin namespace `loom`, flat config only

The plugin object exports `{ meta, rules, configs: { recommended } }`. `recommended` is a self-contained flat-config entry — it carries `plugins: { loom }` itself, so consumers write `import loom from '@loom-js/eslint-plugin'` and spread `loom.configs.recommended` into `eslint.config.js`; rule IDs read `loom/no-tags-import`. All three rules at `error` in `recommended` — two of them mark things that are dead (`@loom-js/tags`) or throw at runtime (`$` props on component tags), and the third is the convention this package exists to enforce; teams downgrade individually if they want advisory mode. No legacy eslintrc shim: eslint 9 is the floor.

### D3 — Loom-template detection: the `html` tag identifier, as a rule option

Rules 2 and 3 must decide "is this tagged template a loom template?" The honest static signal is the tag identifier: the renderer param is named `html` by strong convention (every doc, every first-party component). Both rules take `{ tagNames: ['html'] }` as a default option so a codebase that names the renderer differently can widen it. A renamed tag the option doesn't cover is a documented false negative — better than guessing from call-shape heuristics that would misfire on other tagged-template libraries.

### D4 — `prefer-element-syntax` flags only direct component calls in child positions

An interpolation is flagged when **all** hold: (a) it sits in _child position_ — the preceding quasi text does not end in an attribute-value context (`=`, `="`, `='`); (b) its expression is a _direct_ `CallExpression`; (c) the callee is a capitalized identifier (or a member expression whose final property is capitalized); (d) the callee is not a known global constructor-like (`String`, `Number`, `Boolean`, `Array`, `Object`, `Date`, `Symbol`, `BigInt` — extensible via an `ignoreNames` option).

Everything else is spared _by construction_, which is exactly the sanctioned value-position list: attribute values (`is=${Component}` and any prop) fail (a); `.map` items and callback returns fail (b) — the interpolation's own expression is the `.map(...)` member call or a variable, not the component call; effect hooks (`locationEffect(...)`) fail (c); region variables (`${children}`, `${slots?.x}`) fail (b). Conditional expressions (`${cond ? A({}) : B({})}`) are also spared as non-direct — deliberate conservatism: an enforcer flags the unambiguous case and stays silent otherwise.

### D5 — `no-dollar-props-on-component-tags` scans quasi text inside component tags

A component tag opens where a quasi ends with `<` and the next interpolation expression is a component-shaped callee (per D4-c). From there, the rule scans the attribute region — quasi text (and across further interpolations) until the tag closes (`>`/`/>`) — for attribute names beginning with `$` (e.g. ` $click=`, ` $attrs=`). Each hit reports the attribute name and that `$` has element-only meaning (the runtime throws on first render; the lint catches it at dev time). Plain-element tags never enter the scan, so `$click` on `<button>` stays legal.

### D6 — GritQL mirror: two patterns, shipped as files

A `grit/` directory ships `.grit` patterns for the textually-expressible rules: `no-tags-import` (match `import ... from "@loom-js/tags"`) and `no-dollar-props-on-component-tags` (match `$`-attrs following a `<${`-style tag open). `prefer-element-syntax` needs the child-vs-attr-position distinction, which is beyond an honest textual pattern — documented as an eslint-only rule. Patterns are lint-only (no rewrites), matching the no-codemods policy.

### D7 — Tests run `node --test` against the built output

Mirroring core's `test-server` precedent exactly: `test-ci` = `pnpm build-package && node --test tests/*.test.mjs`. Rule tests use eslint's `RuleTester` with its `describe`/`it` statics pointed at `node:test`, so valid/invalid cases render as native subtests. Testing the built `dist/` also exercises the exact artifact consumers install — no loader indirection for TS test files.

## Risks / Trade-offs

- [Renamed renderer param evades rules 2–3] → `tagNames` option plus a documented false-negative; the repo-wide convention makes this rare in practice.
- [Capitalized non-component call in child position flags falsely] → the global-constructor ignore list plus `ignoreNames`; remaining collisions (a capitalized non-component helper called directly in child position) violate the naming convention the rule assumes, and the report message says so.
- [Quasi-text scanning in D5 is a mini-parser] → scope it to attribute-name tokens inside an open component tag only; the core transform's real parser stays the source of truth (the runtime still throws) — the rule is an early warning, not the enforcement of record.
- [GritQL patterns drift from eslint rules] → both live in one package and version together; the README states the mirror's scope explicitly (no parity promise, per the umbrella decision).

## Open Questions

None — the umbrella decisions close the policy questions, and the rule heuristics are settled above.
