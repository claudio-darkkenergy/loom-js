import { lazyImport } from '@loom-js/core';
import { ArgType, type Meta, type StoryObj } from '@loom-js/storybook';

import { PinkCodePanel, PinkCodePanelProps } from './pink-code-panel';

const { parameters } = (globalThis as any).storybook;

// A story-local tokenizer proving the panel's inversion contract: pink takes
// any `Tokenize` behind a lazy-import activity — it never depends on a
// highlighter (in production, `@loom-js/highlight`'s `storyTokenizer()` is
// one). This stub colors a few token kinds by naive word matching.
const KIND_BY_WORD: Record<string, string> = {
    "'@loom-js/core';": 'string',
    '//': 'comment',
    const: 'keyword',
    export: 'keyword',
    from: 'keyword',
    import: 'keyword',
    npm: 'function',
    return: 'keyword'
};

const storyTokenizer = () =>
    lazyImport(
        'story:code-panel-tokenizer',
        async () => (source: string) =>
            source.split(/(\s+)/).map((word) => ({
                kind: KIND_BY_WORD[word] ?? 'plain',
                text: word
            }))
    );

const meta: Meta = {
    title: 'Components/PinkCodePanel',
    component: PinkCodePanel,
    parameters: {
        decorator: parameters.decorator.block.left()
    },
    argTypes: {
        children: ArgType.disable
    }
};

export default meta;

type Story = StoryObj<PinkCodePanelProps>;

const preformattedCode = [
    'PinkCodePanel({',
    '   children: [',
    '       PinkCodePanel.Header({}),',
    '       PinkCodePanel.Content({',
    '           children: preformattedCode',
    '       })',
    '   ]',
    '})'
].join('\n');

const codePanelContent = PinkCodePanel.Content({
    children: preformattedCode
});

export const WithHeader: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'Code Panel' }),
            codePanelContent
        ]
    }
};

export const WithCopyButton: Story = {
    args: {
        children: [
            PinkCodePanel.Header({
                children: [
                    'Code Panel',
                    PinkCodePanel.CopyButton({ text: preformattedCode })
                ]
            }),
            codePanelContent
        ]
    }
};

const typescriptSample = [
    "import { component } from '@loom-js/core';",
    '',
    '// A counter with an inline template.',
    'export const Counter = component<{ count: number }>(',
    '  (html, { count }) => html`',
    '    <button type="button">Clicked ${count} times</button>',
    '  `',
    ');'
].join('\n');

export const WithHighlighting: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'ts' }),
            PinkCodePanel.Content({
                children: typescriptSample,
                language: 'ts'
            })
        ]
    }
};

export const WithHighlightingBash: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'bash' }),
            PinkCodePanel.Content({
                children: '# install\nnpm i @loom-js/core && echo "done"',
                language: 'bash',
                tokenize: storyTokenizer()
            })
        ]
    }
};

export const WithHighlightingHtml: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'html' }),
            PinkCodePanel.Content({
                children:
                    '<pink-button $label="Save" $type="submit"></pink-button>',
                language: 'html',
                tokenize: storyTokenizer()
            })
        ]
    }
};

// Re-theming is a variable override — here two kinds, scoped to the panel.
export const ThemeOverride: Story = {
    args: {
        children: [
            PinkCodePanel.Header({ children: 'ts' }),
            PinkCodePanel.Content({
                children: typescriptSample,
                language: 'ts'
            })
        ],
        style: {
            '--p-code-token-keyword': '325 100% 65%',
            '--p-code-token-string': '32 92% 60%'
        }
    }
};

export const WithoutHeader: Story = {
    args: {
        children: [codePanelContent]
    }
};
