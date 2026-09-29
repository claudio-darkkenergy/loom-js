# Docs LLMs Text

## Why

An AI agent helping someone write loom code has to fetch the docs one page at a time, and most stop after a page or two. loom is new enough that models know little about it from training, so what the agent fetches is what it knows. Since `readme-slim-down` (2026-09-28) the npm package carries no manual either, so an agent working offline in `node_modules` has only the type declarations.

## What Changes

- The docs app build emits **`/llms.txt`**: the pitch, then each topic in side-nav order with its title, absolute URL and a one-line description.
- The docs app build emits **`/llms-full.txt`**: every topic as plain markdown, concatenated in side-nav order.
- Both are generated in the prerender phase from the Contentful topic data that phase already fetches. Nothing is hand-authored, so neither file can drift from the site.
- `@loom-js/core` ships **`llms-full.txt`** in its published package, generated at `build-package` time from the topic sources in `docs/topics/`, so it documents the version it ships with and needs no network.
- The topic sources, sync tooling and content map move out of archived change directories into `docs/`, since they are now build input.
- The core README's Documentation section points at both site files and names the packaged one.

## Capabilities

### New Capabilities

- `docs-llms-text`: the site serves a generated index and a generated full-text file covering every listed topic; the core package ships the full text for its own version.

### Modified Capabilities

_None._ The README pointer falls under `core-readme-accuracy` as it stands (links resolve, claims match).

## Impact

- `lib/contentful` — a rich-text → markdown serializer beside the existing renderer.
- `apps/loom/project/client/prerender.mts` and `src/app/prerender.entry.ts` — topic bodies exposed to the build; the two files written to the build directory.
- `packages/core` — a generation script, `build-package` wiring, `files` in `package.json`; **patch** changeset.
- `packages/core/README.md` — two links and one sentence.
- `apps/loom/vercel.json` — only if the default headers for `.txt` need adjusting.
- No runtime code in core; no change to topic content.
