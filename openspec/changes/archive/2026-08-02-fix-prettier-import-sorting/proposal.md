## Why

Prettier cannot format **any** `.ts` file in this repo. Every invocation throws `TypeError: Cannot read properties of undefined (reading 'Latest')` from `prettier-plugin-sort-imports`, on untouched files as readily as on edited ones:

```
$ npx prettier --check packages/core/src/activity.ts
[error] TypeError: Cannot read properties of undefined (reading 'Latest')
[error]     at Object.O [as preprocess] (…/prettier-plugin-sort-imports/dist/index.js:6:836)
```

This was hit while completing `fix-custom-element-registration`, whose formatting task had to be satisfied by bypassing the plugin and hand-checking import order. Formatting is a step in every task in this repo, so the breakage taxes all future work, and `.prettierrc` is currently unenforceable.

**Root cause (verified, not inferred).** The plugin calls `ts.createSourceFile(file, text, ts.ScriptTarget.Latest, …)`. TypeScript **7.0.2** — the Go-native port — no longer exposes the legacy compiler API from its main entry; its `exports` map resolves `.` to `./lib/version.cjs`, and the AST surface moved behind `./unstable/*` subpaths with a different shape (`./unstable/ast` has `ScriptTarget` but no `createSourceFile`). So `ts.ScriptTarget` is `undefined`, and reading `.Latest` throws.

**Why TypeScript 7 is even present.** Nothing in this repo asks for it. Every workspace pins `typescript: ^6.0.2` (`packages/core`, `tags`, `pink`, `esbuild-plugin-html-split`, all of `lib/*`, `apps/*`, `services`). The **root** `package.json` declares no `typescript` at all, so pnpm auto-installed the plugin's `typescript: >4.0.0` peer at the newest available major. `pnpm-lock.yaml` confirms `typescript@7.0.2` has exactly one dependent: `prettier-plugin-sort-imports@1.8.11(typescript@7.0.2)`.

**Verified fix.** The plugin works correctly against TypeScript 6. Reproduced in isolation with prettier 3.9.6 + plugin 1.8.11 + typescript 6.0.3, formatting a file with mixed imports:

```ts
// in                                    // out
import { expect } from '@esm-bundle/chai';
import { expect } from '@esm-bundle/chai';
import { expect } from '@esm-bundle/chai';

import { z } from './z';
import { z } from './z';
import { z } from './z';
```

NPM-then-local, blank line between groups — exactly the documented convention.

**Upgrading the plugin does not help.** `1.8.11` is the latest published version. The package _is_ actively maintained (published 2026-02-17) — it simply has not shipped TypeScript 7 support.

> **STATUS — handed off.** Direction below reflects maintainer decisions taken 2026-08-02. One scoping question is deliberately left open (see Open Decisions) for the owner picking this up.

## What Changes

- **Keep `prettier-plugin-sort-imports`** (DECIDED by maintainer). Not `@trivago/prettier-plugin-sort-imports`, which is a different package and the source of the dead config keys below.
- **Do NOT pin the repo to TypeScript 6** (DECIDED by maintainer). The repo uses the latest TypeScript (`^7`). An earlier draft proposed pinning the root to `^6.0.2`; that is rejected.
- **Decouple the plugin's parser from the repo's compiler.** The plugin uses TypeScript purely as a _parser for sorting imports_ — it has no bearing on how the repo type-checks. Pin only the plugin's peer via a scoped override:

    ```jsonc
    // package.json
    "pnpm": {
        "overrides": {
            "prettier-plugin-sort-imports>typescript": "^6.0.2"
        }
    }
    ```

    This satisfies both constraints at once: the repo runs TypeScript 7, and the plugin gets a TypeScript that still exposes the API it calls.

- **Remove the four dead keys from `.prettierrc`.** They belong to `@trivago/prettier-plugin-sort-imports`, a _different_ package from the installed `prettier-plugin-sort-imports` (Sander Ronde's, described upstream as "a prettier plugin for sorting imports by length"). Prettier warns `Ignored unknown option` for each on every run:
    - `importOrderCaseInsensitive`
    - `importOrderSeparation`
    - `importOrderSortSpecifiers`
    - `noMultipleEmptyLines`

    The keys that actually drive the installed plugin — `importTypeOrder`, `sortingMethod`, `newlineBetweenTypes`, `stripNewlines` — are correct and stay. The documented NPM-then-local behavior is unaffected, because it comes from `importTypeOrder`.

- **Add a formatting check that runs in CI**, so a broken formatter surfaces at the commit that breaks it rather than months later inside an unrelated task.
- **Guard the peer resolution** so a future `pnpm install` cannot silently re-float `typescript` to a major the toolchain cannot use.
- **Reconcile the repo's formatted state.** Prettier 3.9.6 formats some existing code differently from whatever version last wrote it (observed: `AnyComponent`'s leading-pipe union in `packages/core/src/types.ts`). Decide deliberately whether to reformat the tree in one commit or scope the check to changed files.

Non-goals: adopting `@trivago/prettier-plugin-sort-imports`, changing the documented import convention, or performing a repo-wide TypeScript 7 migration as part of this change (see Open Decisions).

## Open Decisions

Left deliberately unresolved for whoever implements this.

### 1. How far does TypeScript `^7` adoption go?

Every workspace currently pins `typescript: ^6.0.2` (`packages/core`, `tags`, `pink`, `esbuild-plugin-html-split`, all of `lib/*`, `apps/*`, `services`). Only the root is unpinned, which is why `auto-install-peers` chose 7.0.2 for the plugin's peer. "Use latest" could mean:

- **Root only** — root declares `^7`, workspaces stay `^6.0.2`. ~3 files, no type-check regression risk, but leaves root `tsc` on 7 while every package builds on 6 (the incoherence that exists today).
- **Repo-wide** — root and all ~12 workspaces move to `^7`. Coherent single toolchain, but TypeScript 7 is the Go-native port, not an incremental release: it needs a real regression pass over every workspace's `type-check`, and any errors it surfaces are unrelated to this formatting bug.
- **Split** — this change does the minimum to unblock prettier (scoped override, config cleanup, CI check) and leaves repo TypeScript versions untouched; the TS 7 migration becomes its own proposal with its own regression budget.

The scoped override in _What Changes_ works identically under all three, so this decision does not block starting.

**Unverified:** whether `packages/core` (or any workspace) type-checks clean under TypeScript 7. Worth a spike before committing to repo-wide.

### 2. Open to a better-maintained plugin

The maintainer is open to replacing `prettier-plugin-sort-imports` **if a better-maintained alternative exists** — with one exclusion: **not `@trivago/prettier-plugin-sort-imports`**.

Publish dates as of 2026-08-02:

| Package                                  | Version | Last publish | Parser              | Notes                                                                                         |
| ---------------------------------------- | ------- | ------------ | ------------------- | --------------------------------------------------------------------------------------------- |
| `prettier-plugin-sort-imports` (current) | 1.8.11  | 2026-02-17   | TypeScript API      | Actively maintained; no TS 7 support yet                                                      |
| `@ianvs/prettier-plugin-sort-imports`    | 4.7.1   | 2026-02-04   | Babel               | Immune to TypeScript API churn — but is a `@trivago` fork; confirm that lineage is acceptable |
| `@trivago/prettier-plugin-sort-imports`  | 6.0.2   | 2026-01-07   | Babel               | **Excluded by maintainer**                                                                    |
| `prettier-plugin-organize-imports`       | 4.3.0   | 2025-09-18   | TS language service | **Trap** — same TypeScript 7 wall as the current plugin                                       |

A Babel-based plugin removes the TypeScript coupling entirely and makes the scoped override unnecessary. The cost is a different option surface, so the sort convention must be re-verified and the tree reformatted under it.

Note the current plugin is not abandoned — replacing it is an option to weigh, not a forced migration.

## Capabilities

### New Capabilities

- `formatting-toolchain`: Prettier and its plugins run successfully across the repo, `.prettierrc` contains only options the configured plugins honor, and formatting is verified automatically rather than by hand.

### Modified Capabilities

<!-- None. No existing spec's requirements change. -->

## Impact

- **Code:** `package.json` (root — scoped `pnpm.overrides` entry, format scripts), `.prettierrc` (remove four dead keys), `pnpm-lock.yaml` (regenerated), CI workflow under `.github/workflows/`. Possibly a tree-wide formatting commit.
- **Dependencies:** no change to any workspace's `typescript`. The repo stays on the latest major; `typescript@6.x` is resolved _only_ for the plugin's parser edge, so two majors coexist deliberately. No production dependency changes — `@loom-js/core` still ships zero runtime dependencies. If a Babel-based plugin is adopted instead (Open Decisions #2), the TypeScript coupling disappears and no override is needed.
- **Risk:** Low for the fix itself. The two real decisions are how much of the tree to reformat (churn, not danger) and how far TypeScript 7 adoption goes (Open Decisions #1) — the latter carries genuine regression risk and is why it is scoped out of this change by default.
- **Docs:** `CLAUDE.md` describes the prettier setup and lists formatting as part of the workflow; correct it if the option list or invocation changes.
- **Release:** No changeset — tooling only, no published package behavior changes.
- **Relates to:** `fix-custom-element-registration`, whose task 5.1 is completed-with-caveat and points here.
