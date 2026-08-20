# Design — scrub-core-readme

## Context

`packages/core/README.md` (~850 lines) is the framework's canonical reference. Recent feature work (element syntax, named slots, SSR/hydration/dehydration, diagnostics) kept its own sections current, but the oldest sections — Activities, Components/lifecycle, Bootstrapping, and the Examples block — predate several API evolutions and have drifted. The source of truth is `packages/core/src/` (`activity.ts`, `app.ts`, `component.ts`, `simple.ts`, `lazy-import.ts`, `config.ts`, `types.ts`, `index.ts` for the export map).

## Goals / Non-Goals

**Goals:**

- Every documented signature, argument, option, default, and return shape matches the source.
- Every export of `src/index.ts` (and the server entry) is either documented or deliberately excluded with a recorded reason in the change (not the README).
- Every code example is syntactically valid TypeScript/loom.
- Transforms become a first-class documented concept in the Activities section, since Server rendering, Client hydration, and Dehydrated state sections all reference "async activity transforms" without a definition to point at.

**Non-Goals:**

- No runtime/source changes — if the audit surfaces a code bug, it becomes its own change, not a fix smuggled in here.
- No wholesale README restructure; keep the existing Concepts → Examples architecture and voice.
- No apps/loom docs-content work (this change feeds it).

## Decisions

1. **Audit against `src/index.ts` as the checklist, not the README's own table of contents.** Working from the export map catches omissions (e.g. `simple`, `lazyImport`) that a README-first pass structurally cannot.
2. **Document transforms inside the Activities section** rather than a separate concept section — a transform is an `activity()` argument; the settlement-related sections then link back to it. Alternative (its own "Async data" section) rejected: it would duplicate the dehydration section's story.
3. **Lifecycle hooks get documented once, in the Components concept**, with a five-row timing summary (`onBeforeRender`, `onCreated`, `onMounted`, `onRendered`, `onUnmounted`), and the Life Cycles example is updated to match. The SSR section keeps its server-specific timing notes and stops being the only place three of the hooks appear.
4. **Deliberate exclusions over completionism.** Exports that read as internal plumbing (`canDebug`, `debugIsOn`, `config`, `setToken`, `sanitizeLocation`, `appendChildContext`-tier helpers) are excluded from the README on purpose; the exclusion list and reasons live in this change's tasks/notes. If an export is genuinely public-intent but undocumented, it gets a section.
5. **Stale example policy:** examples referencing retired tooling (`PrerenderSsgWebpackPlugin`) are replaced with current idiom (the SSG story is now `renderToString`), not annotated as legacy.
6. **Prose fixes keep the README's established voice** (the `&`-heavy, em-dash style of the newer sections) rather than normalizing style across the file — style normalization is scope creep.

## Risks / Trade-offs

- [Audit misses a drifted detail because prose reads plausibly] → verification tasks require checking each claim against the source file/line, not re-reading the README; examples get type-checked against the real package (scratch file compiled with the workspace `tsc`).
- [Scope creep into rewriting accurate sections] → tasks enumerate the sections allowed to change; accurate newer sections (element syntax, named slots, SSR, dehydration, diagnostics) only receive cross-link/consistency edits.
- [Include/exclude judgment on config exports mispredicts user intent] → the exclusion list is surfaced in the PR/diff review for the user's call before archive.

## Open Questions

- Whether README-only changes get a changeset (patch) under this repo's convention — resolve at apply time; default to adding a patch changeset since the README ships in the npm package.
