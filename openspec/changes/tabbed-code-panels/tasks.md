# Tasks — tabbed-code-panels

## 1. Pink

- [ ] 1.1 `PinkCodePanel.Tabs`: button-semantics tab strip over pink's `.tabs`/`.tabs-button` classes, driven by a `selection` activity (`bind` for active classes); header-sized like the copy button; Storybook story; **minor** changeset

## 2. App

- [ ] 2.1 `codeTabGroup(group)` keyed selection-activity module (memoized per group; per-panel activity when ungrouped)
- [ ] 2.2 Extend `asCodeBlock`/`CodeSample`: parse the `@tab` directive line; group consecutive tab blocks into one panel; effect-swap the active variant's lines; copy `text` reads the active variant at click time
- [ ] 2.3 Type-checks + `pnpm format`

## 3. Content pipeline

- [ ] 3.1 `md2rich.py`: fence info `tab=<label> [group=<key>]` emits the `@tab` directive line
- [ ] 3.2 Content map: document the convention (directive grammar, consecutive-run rule, group sync)
- [ ] 3.3 Convert the getting-started install block to npm/yarn/pnpm tabs (group `pm`); re-push the draft

## 4. Verification

- [ ] 4.1 Tabs render/switch/copy-active on the install block; a second grouped panel (temporary fixture or a real one) follows the group choice
- [ ] 4.2 Untabbed panels byte-identical (DOM diff); server render of a tabbed panel matches the browser's initial markup (linkedom parity check)
