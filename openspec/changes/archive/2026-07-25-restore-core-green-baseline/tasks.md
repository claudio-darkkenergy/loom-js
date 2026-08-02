## 1. Baseline

- [x] 1.1 Run `pnpm -F @loom-js/core type-check` and `test-ci`; record the current errors (routing import failure; `simple.ts` TS2724/TS2322; `register-custom-element.ts` TS2345) as the Red baseline.

## 2. Stale routing test (Decision 1)

- [x] 2.1 In `packages/core/tests/unit/routing.spec.ts`, remove the `import { sanitizeLocation } from '../../src/routing'` and delete the `describe('sanitizeLocation()')` block (and any now-unused helpers). Keep the rest of the routing spec.
- [x] 2.2 Run `test-ci`; confirm `routing.spec.ts` now loads and its remaining tests run.

## 3. Orphaned `simple.ts` (Decision 2)

- [x] 3.1 Confirm `simple` is not exported from `src/index.ts` and not imported anywhere (re-verify with a repo grep).
- [x] 3.2 Default: delete `packages/core/src/simple.ts` (and any `simple`-only unused type). If the maintainer wants to keep it as public API instead, fix the type import (define/rename `SimpleTemplateFunction` or use `SimpleComponent`), correct the `ComponentProps`/`ComponentInputProps` usage, export it from `index.ts`, and add a smoke test. **RESOLVED (maintainer): DELETE.** Intent recovered — `simple()` was the opt-in custom-element wrapper for plain-function components (README:287), added in `998e7bf` alongside `registerCustomElement`. It never compiled (`SimpleTemplateFunction` never existed in any commit), was never exported/called/tested, and cannot serve `SimpleComponent`'s `ContextFunction | ContextFunction[]` return — `registerCustomElement` handles only a single `ContextFunction`. Follow-up proposal requested for doing custom-element registration properly.

## 4. register-custom-element (Decision 3)

- [x] 4.1 Fix the `TS2345` at `register-custom-element.ts:64` by passing the intended `ComponentInputProps<Props>`-compatible value (match the `componentFunction` contract; avoid a blind `as` cast).
- [x] 4.2 Remove the leftover `console.log({ _children, _scope, _props, $props, props })` block (lines ~57–63).
- [x] 4.3 Confirm custom-element instantiation is covered by `component.spec.ts`; add a focused instantiation test only if it is not.

## 4b. Test project type-checking (surfaced while fixing editor `describe`/`it`)

- [x] 4b.1 Editor `describe`/`it` fix. Root cause: `tsserver` only auto-loads files named `tsconfig.json`, so editing `tsconfig.spec.json` never reached the editor. Fix (done): added a discoverable `packages/core/tests/tsconfig.json` (extends `../tsconfig.json`, `types: [mocha, node]`, `rootDir: ..`, includes `../src` + tests) — `tsserver` picks the nearest config for test files. `tsconfig.spec.json` reverted to its minimal form (only feeds wtr's esbuild). Verified: describe/it resolve, `activity-array.spec.ts` clean, build/`type-check` configs untouched, wtr still green.
- [x] 4b.2 Add a CI script that type-checks the test project (e.g. `type-check-tests: tsc -p tests/tsconfig.json`) so these no longer hide.
- [x] 4b.4 (Optional consolidation) Two test configs now exist: `tests/tsconfig.json` (editor type-check) and `tsconfig.spec.json` (wtr esbuild transpile, referenced by `web-test-runner.config.mjs:11`). Consider pointing wtr at `tests/tsconfig.json` and deleting `tsconfig.spec.json` so there is a single test config. Verify `pnpm -F @loom-js/core test-ci` still passes after repointing.
- [x] 4b.3 Fix the 13 latent test-file type errors now visible:
    - `tests/index.ts` — `Config.win` missing (2339), implicit-any index (7015), `HookFunction` arg (2345). INTENT RECOVERED: this was the project's original hand-rolled puppeteer + Koa integration harness (custom `suite`/`test` DSL, injectable-window via `config.win`), predating `@web/test-runner` and now superseded by it; already broken (dead `test-pupp` script → nonexistent `tsconfig-tests.json`; toolchain deps `ts-node`/`tsconfig-paths`/`koa`/`proxyquire`/`chai` all removed). **DECISION (maintainer): DELETE `tests/index.ts`.** Also remove the now-dead `test-pupp` script from `package.json` and, if present, the stale `tsconfig-tests.json` reference. (`config.win` is confirmed **obsolete** — deleting this file removes its only usage; the injectable-window/SSR idea is being explored fresh, not resurrected from here.)
    - `tests/support/mocks/component.ts` & `tests/support/mocks/template.ts` — `Cannot find module 'proxyquire'` (2307). Same abandoned harness era (`proxyquire` no longer a dep). **DECISION (maintainer): DELETE both mock files** (verify nothing still imports them first). Do NOT re-add `proxyquire`.
    - `tests/support/components/container.ts:50` — `ContextFunction | Text | ContextFunction[]` not assignable (2322).
    - `tests/templates/test-template.ts` — implicit-any binding elements (7031).
    - `tests/unit/activity.spec.ts` — implicit-any `effect` (7031), unused `update` (6133).
    - `tests/unit/app.spec.ts:23` & `tests/unit/component/life-cycles.ts:86,96` — object possibly undefined (2532).
    - `tests/unit/routing.spec.ts:2` — `sanitizeLocation` no longer exported (2305) — resolved by task 2.1.

## 6. Commit shared Claude Code settings (`.claude/settings.json`)

- [x] 6.1 Commit `.claude/settings.json` as the repo's **shared** Claude Code config — `.claude/commands/` and `.claude/skills/` are already tracked, so shared config belongs with them.
- [x] 6.2 Do NOT ship `Bash(git config --global:*)` in the shared file: `git config --global` writes to each contributor's machine-wide git config, so pre-approving it repo-wide grants a machine-scoped side effect to everyone who clones. It belongs in the untracked per-developer `.claude/settings.local.json`.
- [x] 6.3 Seed the shared file with this repo's documented verification loop instead (`openspec` read-only subcommands, `type-check`, `type-check-tests`, `test-ci`, `build-packages`, `status-packages`) so contributors are not prompted for the commands CLAUDE.md tells them to run. Mutating commands (`openspec archive`, `pnpm publish-packages`, git writes) intentionally still prompt.
- [x] 6.4 Add `.claude/settings.local.json` and `.claude/scheduled_tasks.lock` to `.gitignore` — both were only ignored via this machine's global gitignore / `.git/info/exclude`, so the ignore was not portable to other clones.
- [x] 6.5 MANUAL (maintainer): recreate `.claude/settings.local.json` with `{"permissions":{"allow":["Bash(git config --global:*)"]}}` to keep that grant locally. Claude Code blocked the assistant from writing a permissions file directly.

## 5. Verify + close

- [x] 5.1 `pnpm -F @loom-js/core type-check` → 0 errors.
- [x] 5.2 `pnpm -F @loom-js/core test-ci` → all spec modules load; full suite green (this also clears the pre-existing failure the other two changes had to work around).
- [x] 5.3 Prettier per `.prettierrc`.
- [x] 5.4 Add a patch changeset ONLY if `register-custom-element` behavior is observably affected; otherwise none.
- [x] 5.5 Update `SOLID-AUDIT-REPORT.md` if a violation was touched; update `.claude/skills/skill-config.md` only if conventions changed.
