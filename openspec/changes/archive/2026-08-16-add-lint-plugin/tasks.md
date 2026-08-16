# add-lint-plugin — tasks

TDD workflow applies (Red → Green → Refactor): each rule lands its failing RuleTester cases first, then the implementation. Rules are authored in TypeScript and tested against the built `dist/` (design D7), so each Red step includes a build.

## 1. Package scaffold & repo wiring

- [x] 1.1 Scaffold `packages/eslint/eslint-plugin`: `package.json` (`@loom-js/eslint-plugin`, `private: true`, `publishConfig.access: public`, `type: "module"`, `exports` → `dist/index.js`, `files` incl. `dist/` + `grit/`, peerDep `eslint >= 9`, devDeps eslint + `@loom-js/typescript-config` + typescript), `tsconfig.json` extending the shared lib base with `outDir: dist`, scripts `build-package` / `test-ci` / `type-check`.
- [x] 1.2 Repo wiring: add `packages/eslint/*` to `pnpm-workspace.yaml`; add the new `package.json` to `.prettierrc` `packageJSONFiles`; `pnpm install` to link the workspace.
- [x] 1.3 Plugin skeleton: `src/index.ts` exporting `{ meta, rules: {}, configs }` with a self-contained `recommended` flat config (design D2); test harness wiring (`RuleTester` statics → `node:test`) proven with a placeholder test; `pnpm -F @loom-js/eslint-plugin test-ci` runs green end-to-end.

## 2. Rules (Red → Green each)

- [x] 2.1 `no-tags-import` — Red: RuleTester cases for static imports, `export * from`, subpaths, and passing `@loom-js/core`/`@loom-js/pink` imports; Green: rule over `ImportDeclaration`/`ExportAllDeclaration`/`ExportNamedDeclaration` sources. → Implemented, then **descoped and removed** (rule, tests, grit mirror): `@loom-js/tags` has no external users; the owner-side `npm deprecate` is the native enforcement surface (see design Non-Goals).
- [x] 2.2 `prefer-element-syntax` — Red: cases for the direct-call flag plus every spared position (attr values, `.map` items, effect hooks, region variables, global constructor-likes, non-loom tags, `ignoreNames`/`tagNames` options); Green: child-position + direct-call + component-callee detection per design D4/D3.
- [x] 2.3 `no-dollar-props-on-component-tags` — Red: cases for `$` props on component tags (single and multiple, across interpolation boundaries), passing `$` attrs on plain elements, and non-loom tags; Green: quasi-text attribute-region scan per design D5.
- [x] 2.4 Flat-config integration test: a fixture linted through `loom.configs.recommended` (eslint's `Linter`/`ESLint` API) reports all rule IDs at `error` (both, after the 2.1 descope).

## 3. GritQL mirror

- [x] 3.1 `grit/no-tags-import.grit` and `grit/no-dollar-props-on-component-tags.grit`, lint-only; verify each pattern's match set against the same fixtures the eslint rules use (spot-check — no parity harness). → Both spot-checked via the grit CLI; `no-tags-import.grit` later removed with the 2.1 descope — the shipped mirror is `no-dollar-props-on-component-tags.grit` only.

## 4. Docs, release & closeout

- [x] 4.1 Package README: install + flat-config usage, the rules with flagged/spared examples, the deferred array-composition constraints, the GritQL scope note (no `prefer-element-syntax`, no parity promise), and the no-autofix policy.
- [x] 4.2 Changeset for `@loom-js/eslint-plugin` (initial release); confirm `pnpm status-packages` parses it.
- [x] 4.3 `skill-config.md`: record the new package, its layout, and the test/build commands (Skill Config Rule — new workspace + test configuration).
- [x] 4.4 Check umbrella task 5.1 in `openspec/changes/element-syntax-first/tasks.md` with a pointer to this change; note the umbrella is then archive-ready (its remaining conversion-change task 4.3 is the owner-side `npm deprecate`).
- [x] 4.5 Full verification: `pnpm -F @loom-js/eslint-plugin test-ci` + `type-check`, root `pnpm format:check`, and `pnpm -F @loom-js/core test-ci` untouched-sanity pass.
