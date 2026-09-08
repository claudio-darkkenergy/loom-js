# Tabbed Code Panels

## Why

Some code samples are the same instruction in N dialects — the install block (npm/yarn/pnpm) being the archetype. A single multi-line block shows all three but the panel's copy button copies all three; separate blocks triple the vertical space. A tabbed panel shows one variant at a time, copies the active one, and remembers the reader's choice across panels (maintainer request, 2026-08-30, during the getting-started draft review).

## What Changes

- `@loom-js/pink`: `PinkCodePanel.Tabs` — a tab strip for the panel header built on pink's `.tabs`/`.tabs-button` classes (button semantics, not links), driven by a selection activity so the active variant's content and copy text swap in place. Non-breaking; panels without tabs are untouched.
- `apps/loom` rich-text rendering: consecutive sole-code paragraphs whose directive carries a tab label merge into one tabbed panel; the active tab's code feeds the existing copy button.
- Authoring convention (content map): the directive grammar grows one optional line — `// @tab <label> [<group>]` after `// @lang <lang>`. Blocks sharing a group sync their selection app-wide (pick pnpm once, every install block follows).
- `contentful-sync/md2rich.py`: fence info `bash tab=npm group=pm` emits the directive, so topic sources author tabs as plain fenced blocks.
- First consumer: the getting-started install block becomes npm/yarn/pnpm tabs.

## Capabilities

### New Capabilities

- `tabbed-code-variants`: how variant code blocks group into one tabbed panel — the directive convention, tab rendering/selection, group-synced choice, copy-active behavior, and prerender parity (default tab on the server).

### Modified Capabilities

_None._

## Impact

- `packages/pink` — `PinkCodePanel.Tabs` (+ story, **minor** changeset). Builds on existing `.tabs` CSS; no new dependency.
- `apps/loom` — `styled-rich-text/lib/code.ts` grouping + tab wiring; a small keyed selection-activity module for group sync.
- `openspec/changes/align-loom-docs-with-core-readme/contentful-sync/` — converter fence-meta support; getting-started source updated; map convention entry.
- Depends on nothing in flight; the install block lands whenever this ships (drafts re-push is cheap).
