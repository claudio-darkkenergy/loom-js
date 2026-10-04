---
slug: pink-code-panels
title: Code Panels
package: @loom-js/pink
entryTitle: Pink: Code Panels
---
`PinkCodePanel` renders a block of code: a header with a label, tabs and a copy button, and a content area with line numbers and syntax highlighting. Pink carries no highlighter of its own — the panel takes a tokenizer from the app, and `@loom-js/highlight` is the one loom ships. This topic covers the parts, the highlighting contract, tabbed variants and the token theme. Every code sample on this site is one of these panels.

## The panel and its parts

`PinkCodePanel` is the frame — a `<span class="code-panel">` by default (`is` to change it) — and its parts are properties on it.

### `Header`

A `<header class="code-panel-header">`; its `children` are the label text and, optionally, the tabs and the copy button.

### `Content`

A `<code class="code-panel-content grid-code">` that splits `children` — the source as one string — into lines, each with a line number (`useLineNumbers`, default `true`). Give it a `language` and a `tokenize` activity and the lines render highlighted; without either, they render as plain text.

### `CopyButton`

A [`PinkCopyButton`](/docs/pink-elements#pink-copy-button) sized for the header's label line and pushed to its end edge, labelled "Copy code". `text` is the code to copy, or a getter for code only known at click time — a tabbed panel's active variant.

### `Tabs`

The header's tab strip: one button per entry of `labels`, driven by a `selection` activity (see [Tabbed variants](#tabbed-variants)). `tabsLabel` names the list for assistive technology (default "Code variants").

```ts
import { component } from '@loom-js/core';
import { PinkCodePanel } from '@loom-js/pink';

const source = `import { component } from '@loom-js/core';

export const Hello = component((html) => html\`<p>Hello</p>\`);`;

export const Sample = component(
    (html) => html`
        <${PinkCodePanel}>
            <${PinkCodePanel.Header}>
                ts
                <${PinkCodePanel.CopyButton} text=${source} />
            </>
            ${PinkCodePanel.Content({ children: source, language: 'ts' })}
        </>
    `
);
```

`Content` is called as a function because its `children` is the source as one string — a template's children would arrive as nodes.

Two variables theme the frame: `codePanelContent` sets the content background (`--p-code-panel-content`) and `codePanelTextColor` the text color.

## Highlighting

### The `tokenize` contract

`Content` highlights through a function it is handed, not a dependency it owns. The contract is two types pink exports:

```ts
interface CodeToken {
    kind: string;
    text: string;
}

type Tokenize = (text: string, language: string) => CodeToken[];
```

The panel wants the tokenizer as a [lazy-import activity](/docs/lazy-imports) — `TokenizeActivity`, the type of `lazyImport<Tokenize>(...)` — so a highlighter's grammars load on demand: lines render plain the moment the panel mounts and re-render highlighted when the tokenizer lands. The whole source is tokenized at once, then split by line, so a token spanning lines (a block comment, a template literal) keeps its kind on every line it touches. Each token renders as `<span class="code-token is-<kind>">`; `plain` runs render as bare text.

### `@loom-js/highlight`

The shipped tokenizer. `codeTokenizer()` returns the activity, cached for the life of the page, over Prism with the `markup`, `javascript`, `typescript` and `bash` grammars and the short names content authors write — `ts`, `js`, `html`, `svg`, `xml`, `sh`, `shell`. It maps Prism's token types onto pink's kinds, so the two packages agree on the vocabulary without either importing the other.

```ts
import { component } from '@loom-js/core';
import { codeTokenizer } from '@loom-js/highlight';
import { PinkCodePanel } from '@loom-js/pink';

export const Highlighted = component<{ code: string; language: string }>(
    (html, { code, language }) => html`
        <${PinkCodePanel}>
            <${PinkCodePanel.Header}>${language}</>
            ${PinkCodePanel.Content({
                children: code,
                language,
                tokenize: codeTokenizer()
            })}
        </>
    `
);
```

Any function matching `Tokenize` behind a `lazyImport` works in its place; the panel's Storybook story uses a word-matching stub to prove the point.

## Tabbed variants

One panel can show several variants of the same code — the install command per package manager — with a tab per variant. The strip takes the `labels` and a `selection`: an activity whose `update` picks a label and whose `bind` reflects the selected tab in place, so the strip itself never re-renders. The panel's content and copy text read the same activity:

```ts
import { activity, component } from '@loom-js/core';
import { codeTokenizer } from '@loom-js/highlight';
import { PinkCodePanel } from '@loom-js/pink';

const variants: Record<string, string> = {
    npm: 'npm i @loom-js/core',
    yarn: 'yarn add @loom-js/core',
    pnpm: 'pnpm add @loom-js/core'
};
const labels = Object.keys(variants);
const selection = activity('npm');
const code = () => variants[selection.value()] ?? '';

export const Install = component(
    (html) => html`
        <${PinkCodePanel}>
            <${PinkCodePanel.Header}>
                bash
                ${PinkCodePanel.Tabs({ labels, selection })}
                <${PinkCodePanel.CopyButton} text=${code} />
            </>
            ${selection.effect(() =>
                PinkCodePanel.Content({
                    children: code(),
                    language: 'bash',
                    tokenize: codeTokenizer(),
                    useLineNumbers: false
                })
            )}
        </>
    `
);
```

### `resolveCodePanelTab`

`resolveCodePanelTab(labels, selectedLabel)` returns the label a panel shows for a selection: the selection itself when the panel has that tab, otherwise the panel's first. It exists for shared selections, where one activity can name a label some panels do not carry.

### Shared selections

Panels that pass the same `selection` activity switch together — pick `pnpm` in one install panel and every install panel follows. Each panel resolves the shared label through `resolveCodePanelTab`, so a panel without that tab falls back to its first instead of showing nothing. On this site, tab groups are declared in the content (`// @tab pnpm pm`) and the app keeps one activity per group name.

## Theming

Token colors are the `--p-code-token-<kind>` variables on `.code-panel`, one per kind — `attr-name`, `attr-value`, `class-name`, `comment`, `constant`, `function`, `keyword`, `number`, `operator`, `property`, `punctuation`, `regex`, `string`, `tag`, `variable` — as HSL triplets. The base values are the light theme; `.theme-dark` carries the dark preset. Redefine any of them on `.code-panel`, on an ancestor, or on one panel's `style` to re-theme:

```ts
import { component } from '@loom-js/core';
import { PinkCodePanel } from '@loom-js/pink';

export const WarmPanel = component(
    (html, { children }) => html`
        <${PinkCodePanel}
            style=${{
                '--p-code-token-keyword': '325 100% 65%',
                '--p-code-token-string': '32 92% 60%'
            }}
        >
            ${children}
        </>
    `
);
```

Nothing else in the stylesheet references these colors, so a theme is exactly this list.

## Example

The docs site's code sample is the full composition: a header carrying the language label and a copy button, content highlighted through `codeTokenizer()`, line numbers only for multi-line code:

```ts
import { codeTokenizer } from '@loom-js/highlight';
import { PinkCodePanel } from '@loom-js/pink';

export const CodeSample = ({ code, language }: { code: string; language?: string }) =>
    PinkCodePanel({
        children: [
            PinkCodePanel.Header({
                children: [language ?? '', PinkCodePanel.CopyButton({ text: code })]
            }),
            PinkCodePanel.Content({
                children: code,
                language,
                tokenize: codeTokenizer(),
                useLineNumbers: code.includes('\n')
            })
        ]
    });
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinkcodepanel--with-header)
