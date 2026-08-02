## Context

Prettier throws on every `.ts` file in the repo. The failure chain is fully established (see `proposal.md`) and each link is verified rather than inferred:

```
.npmrc: auto-install-peers=true
  └─ root package.json declares no `typescript`
      └─ prettier-plugin-sort-imports@1.8.11 peer `typescript: >4.0.0`
          └─ pnpm installs typescript@7.0.2 (newest major)
              └─ TS7 exports map: "." → "./lib/version.cjs"  (legacy compiler API gone)
                  └─ plugin calls ts.ScriptTarget.Latest → undefined.Latest → TypeError
```

Two facts constrain the solution:

1. **Nothing in the repo wants TypeScript 7.** Every workspace pins `^6.0.2`. `pnpm-lock.yaml` shows `typescript@7.0.2` with exactly one dependent — the plugin's auto-installed peer.
2. **The plugin cannot be upgraded out of the problem.** `1.8.11` is the latest published version. It is also not the widely-known `@trivago/prettier-plugin-sort-imports`; it is Sander Ronde's package of the same short name, which explains why four `.prettierrc` keys are silently ignored.

The repo has one CI workflow (`publish-packages.yml`) and no root `format` script, so nothing would have caught this. It surfaced only when a task happened to run prettier by hand.

## Goals / Non-Goals

**Goals:**

- `npx prettier --check .` runs to completion across the repo.
- `.prettierrc` contains only options the configured plugin honors — no `Ignored unknown option` warnings.
- The documented import convention (NPM group, blank line, local group) is enforced by tooling rather than by hand.
- A broken formatter fails CI at the commit that breaks it.
- The peer cannot silently re-float on the next `pnpm install`.

**Non-Goals:**

- Migrating the repo to TypeScript 7.
- Replacing the import-sorting plugin or changing the sort convention.
- Adding a linter, or any formatting rule not already in `.prettierrc`.

## Decisions

### D1: Scope the TypeScript pin to the plugin, not the repo (REVISED by maintainer)

> **Superseded direction.** An earlier draft of this design proposed declaring `typescript@^6.0.2` at the repo root, pinning the whole toolchain to TypeScript 6. **The maintainer rejected that**: the repo uses the latest TypeScript (`^7`). Recorded here so it is not re-proposed.

The two concerns are separable, and conflating them was the error in the earlier draft. The plugin uses TypeScript **only as a parser for sorting import statements**. It never type-checks anything, and its TypeScript has no relationship to the compiler the repo builds and checks with. So pin only the plugin's peer:

```jsonc
// package.json
"pnpm": {
    "overrides": {
        "prettier-plugin-sort-imports>typescript": "^6.0.2"
    }
}
```

The `parent>child` selector constrains that one edge in the graph, leaving every workspace's own `typescript` untouched and free to move to `^7`.

**Why TypeScript 7 cannot simply be made to work — investigated, not assumed.** The plugin calls `ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, …)`. In TypeScript 7:

| Entry point              | `ScriptTarget` | `createSourceFile`                                                                                 |
| ------------------------ | -------------- | -------------------------------------------------------------------------------------------------- |
| `.` (main)               | —              | — resolves to `./lib/version.cjs`                                                                  |
| `./unstable/ast`         | present        | absent                                                                                             |
| `./unstable/ast/factory` | absent         | present, but it is the **node factory** (arity 5, builds a SourceFile from parts) — not the parser |
| `./unstable/sync`        | absent         | absent — Program/Project API only                                                                  |

There is no standalone text→AST parse entry in TypeScript 7's public surface. Patching the plugin onto it would mean rewriting it against `unstable/sync` Program machinery — a rewrite, not a shim. So the plugin genuinely requires a TypeScript 6 parser for as long as it is the chosen plugin.

**Verified in isolation** — prettier 3.9.6 + plugin 1.8.11 + typescript 6.0.3, formatting a file with mixed imports, produced correct output (NPM group first, blank line, local group). The parser pin is the whole fix; everything else here is hygiene around it.

**Alternatives considered:**

- **Root-level `typescript@^6.0.2`** — rejected by the maintainer, as above. It would have worked, but at the cost of holding the entire repo back to TypeScript 6 to satisfy a formatting plugin.
- **Repo-wide `pnpm.overrides` on `typescript`** — forces one version on every workspace, which is the opposite of the goal now that the repo is moving to `^7`.
- **`auto-install-peers=false`** — addresses the general mechanism rather than this instance, and changes install behavior for every package in the monorepo. Too broad for a formatting bug; tracked separately in tasks 6.2.
- **Patch the plugin via `pnpm patch`** — not viable, per the API table above.
- **Replace the plugin with a Babel-based sorter** — genuinely removes the coupling. Now an open option rather than a deferred one; see D6.

### D2: Delete the four dead `.prettierrc` keys

`importOrderCaseInsensitive`, `importOrderSeparation`, `importOrderSortSpecifiers`, and `noMultipleEmptyLines` are `@trivago` options. The installed plugin honors only `importTypeOrder`, `sortingMethod`, `newlineBetweenTypes`, and `stripNewlines` (confirmed against its `dist/`). Prettier warns on each ignored key on every run, which is noise that trains people to ignore prettier's output — the exact reflex that let this bug survive.

Deleting them changes no behavior, because they were never applied. The documented NPM-then-local ordering comes from `importTypeOrder: ["NPMPackages", "localImports"]`, which is real and stays.

### D3: Add `format` and `format:check` scripts, and run the check in CI

Root scripts, so the invocation is one obvious thing rather than a remembered `npx` line. `format:check` runs in CI on push and PR. This is the control that prevents a silent recurrence — the fix in D1 is one line, but nothing today would notice it regressing.

### D4: Reformat the tree in its own isolated commit

Prettier 3.9.6 formats some existing code differently from whatever version last wrote it — observed on `AnyComponent` in `packages/core/src/types.ts`, where 3.9.6 collapses a leading-pipe union. So enabling a repo-wide check will surface pre-existing drift that has nothing to do with anyone's current work.

Do the reformat as a **single dedicated commit containing no behavior change**, and add its SHA to `.git-blame-ignore-revs` so `git blame` stays readable. The alternative — scoping the CI check to changed files only — keeps the diff small but leaves the tree permanently half-formatted and makes the check depend on diff computation. Prefer paying the churn once.

### D5: Guard the peer resolution

An explicit root dependency is sufficient in principle: explicit declarations beat `auto-install-peers`. Verify it by deleting `node_modules` and the lockfile entry and re-installing, confirming `typescript@7` does not reappear. If it does, escalate to a `pnpm.overrides` entry for `typescript` and record why in `.npmrc` or `package.json`.

### D6: Replacing the plugin is an open option, with one exclusion

**Correcting an earlier claim in this document:** the current plugin is _not_ unmaintained. `prettier-plugin-sort-imports@1.8.11` was published **2026-02-17** — it is actively maintained and simply has not shipped TypeScript 7 support. The earlier framing of this decision as "keeping an unmaintained plugin alive" was wrong.

The maintainer's position: **keep `prettier-plugin-sort-imports`, but open to a better-maintained alternative — excluding `@trivago/prettier-plugin-sort-imports`.**

| Package                                  | Version | Last publish | Parser              | Verdict                                                                                                                                                                   |
| ---------------------------------------- | ------- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prettier-plugin-sort-imports` (current) | 1.8.11  | 2026-02-17   | TypeScript API      | Incumbent. Needs the D1 parser pin.                                                                                                                                       |
| `@ianvs/prettier-plugin-sort-imports`    | 4.7.1   | 2026-02-04   | Babel               | Strongest alternative — no TypeScript coupling, so D1's override disappears. **Caveat:** it is a `@trivago` fork; confirm that lineage is acceptable given the exclusion. |
| `@trivago/prettier-plugin-sort-imports`  | 6.0.2   | 2026-01-07   | Babel               | **Excluded by maintainer.**                                                                                                                                               |
| `prettier-plugin-organize-imports`       | 4.3.0   | 2025-09-18   | TS language service | **Trap.** Hits the same TypeScript 7 wall as the incumbent — it would not fix anything.                                                                                   |

The trade: a Babel-based plugin deletes the whole TypeScript-coupling problem permanently, but brings a different option surface, so the sort convention has to be re-verified and the tree reformatted under it. Since the incumbent is maintained, staying put is defensible — this is a choice to weigh, not a forced migration.

**Expiry condition for the incumbent:** if `prettier-plugin-sort-imports` ships TypeScript 7 support, the D1 override can be deleted outright. Worth checking upstream before doing any migration work.

### D7: Implementation findings (added during apply, 2026-08-02)

Two facts surfaced during implementation that amend D1/D2 mechanically without changing their direction:

1. **The override lives in `pnpm-workspace.yaml`, not `package.json`.** pnpm 10.33 warns `The "pnpm" field in package.json is no longer read by pnpm` and ignores `pnpm.overrides` there. The repo already keeps its security overrides in `pnpm-workspace.yaml`'s `overrides:` block, so the scoped `'prettier-plugin-sort-imports>typescript': ^6.0.2` entry joined them — with the added benefit that YAML takes real comments, satisfying the "explain it next to the override" requirement directly. Also note: after adding the override, both `pnpm install` and `pnpm install --force` reused the stale `typescript@7.0.2` peer resolution from the lockfile; a `pnpm remove` + `pnpm add` of the plugin was needed to force re-resolution.

2. **`packageJSONFiles` must enumerate every workspace manifest.** The plugin classifies an import as `NPMPackages` only if the package is listed in one of the `packageJSONFiles` (default: the root `package.json`, resolved relative to the prettier config). In this monorepo almost every real NPM dep lives in a workspace manifest, so with the default, imports like `@esm-bundle/chai` (devDep of `packages/core`) were classified as _local_ — a tree-wide reformat would have demoted NPM imports below local ones, violating this change's own spec ("NPM packages first"). `.prettierrc` now lists all 17 `package.json` files. Maintenance note: **a new workspace must be added to `packageJSONFiles`** or its deps will sort into the local group; the CI format check will surface the drift.

## Risks / Trade-offs

- **A tree-wide reformat produces a large, noisy diff.** → Isolate it in its own commit with no behavior change, and add the SHA to `.git-blame-ignore-revs`.
- **The scoped override could silently stop matching** if the plugin's package name or peer edge changes. → Verify after every install that the plugin resolved a TypeScript 6 (task 4.3); a failing `format:check` in CI surfaces it immediately.
- **Two TypeScript majors coexist in the tree** (7 for the repo, 6 for the plugin's parser). → Acceptable and intentional: they never interact. Worth a comment beside the override so it does not read as an oversight.
- **Repo-wide TypeScript 7 adoption is unverified.** No workspace has been type-checked under TS 7 — it is the Go-native port, not an incremental release. → Do not bundle that migration into this change; spike it first (proposal, Open Decisions #1).
- **CI formatting checks can become a merge-blocking nuisance** if the tree is not fully formatted first. → Sequence matters: reformat, then enable the check.
- **The plugin lags the TypeScript major the repo runs on.** It is maintained (published 2026-02-17) but has no TypeScript 7 support, so the parser pin persists until upstream catches up. → Check upstream before any migration work; D6 records both the exit and the expiry condition.

## Migration Plan

1. Add the scoped `pnpm.overrides` entry pinning the plugin's `typescript` to `^6.0.2`; reinstall; confirm the plugin resolved TypeScript 6 and prettier runs. Repo TypeScript stays on `^7`.
2. Clean `.prettierrc`; confirm no `Ignored unknown option` warnings.
3. Reformat the tree in an isolated commit; record the SHA in `.git-blame-ignore-revs`.
4. Add scripts and the CI job last, once the tree is clean.

Rollback is trivial at any step — every change is to configuration, and none of it touches shipped code. No changeset: no published package behavior changes.

## Open Questions

- **RESOLVED:** Pin the repo to TypeScript 6? → **No.** The repo uses latest (`^7`); only the plugin's parser edge is pinned (D1).
- **RESOLVED:** Switch to `@trivago/prettier-plugin-sort-imports`? → **No.** Explicitly excluded; keep `prettier-plugin-sort-imports`, though a better-maintained alternative is welcome (D6).
- **OPEN — for the implementer:** how far does TypeScript `^7` adoption go (root only / repo-wide / split into its own change)? See proposal, Open Decisions #1. Does not block starting — the D1 override behaves identically under all three.
- **OPEN:** is `@ianvs/prettier-plugin-sort-imports` acceptable given that it is a `@trivago` fork, and given that the incumbent is actively maintained? (D6)
- **OPEN:** reformat everything, or only enforce on changed files? D4 recommends the full reformat; it is the only part of this change touching many files.
- **OPEN:** should `format:check` cover Markdown and JSON as well as `.ts`, or start with source files only? A broader net catches more drift but makes step 3 larger.
- **UNVERIFIED:** does any workspace type-check clean under TypeScript 7? Spike before committing to repo-wide adoption.
