# Tasks — docs-llms-text

## 0. Topic sources

- [x] 0.1 Move the topic sources to `docs/topics/`, the sync tooling to `docs/contentful-sync/`, the content map to `docs/content-map.md`; update every live reference (core script, `turbo.json`, `.prettierignore`, `CLAUDE.md`, pending proposals)
- [x] 0.2 Verify: `push.py --dry` lists every topic; `build-package` writes the same file as before the move

## 1. Serializer

- [x] 1.1 Red: serializer specs over rich-text fixtures — headings, paragraphs, inline code, fenced blocks with `// @lang`, the single-line rule, quotes, tables, lists, links made absolute, unknown node throws
- [x] 1.2 Green: the rich-text → markdown serializer in `@loom-js/contentful`; type-check

## 2. Site files

- [x] 2.1 Expose topic bodies and side-nav groups to the prerender runner through `prerender.entry.ts`
- [x] 2.2 Write `llms.txt` and `llms-full.txt` to the build directory in the prerender phase; fail on a missing lead or an empty topic; log both sizes
- [x] 2.3 Verify on a production build: entry count equals the listing, every URL resolves, a topic's text matches its prerendered page; check the served content type and cache headers on a preview deploy

## 3. Packaged file

- [x] 3.1 Generation script in `packages/core` reading the topic sources; wire into `build-package`; add to `files`; git-ignore the output
- [x] 3.2 Verify with `pnpm pack`: the tarball contains `llms-full.txt`; the script runs with the network off
- [x] 3.3 **Patch** changeset for `@loom-js/core`

## 4. Pointers

- [x] 4.1 Core README Documentation section: links to both site files, one sentence naming the packaged file; content map note
- [x] 4.2 Update `.claude/skills/skill-config.md` for the new build output and script
- [x] 4.3 Maintainer reviews the diff and a sample of both files before commit
