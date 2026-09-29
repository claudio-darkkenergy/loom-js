import { describe, it } from 'node:test';

import {
    documentToMarkdown,
    inlineToMarkdown
} from '../src/rich-text-markdown.ts';
import assert from 'node:assert/strict';

const text = (value, ...markTypes) => ({
    data: {},
    marks: markTypes.map((type) => ({ type })),
    nodeType: 'text',
    value
});
const block = (nodeType, content, data = {}) => ({ content, data, nodeType });
const paragraph = (...content) => block('paragraph', content);
const documentOf = (...content) => block('document', content);

describe('documentToMarkdown', () => {
    it('separates blocks with a blank line and keeps heading levels', () => {
        const markdown = documentToMarkdown(
            documentOf(
                paragraph(text('Lead.')),
                block('heading-2', [text('Install')]),
                block('heading-3', [text('With '), text('pnpm', 'code')])
            )
        );

        assert.equal(markdown, 'Lead.\n\n## Install\n\n### With `pnpm`');
    });

    it('wraps neighbors sharing a mark as one span', () => {
        const markdown = documentToMarkdown(
            documentOf(
                paragraph(
                    text('Run ', 'bold'),
                    text('init', 'bold', 'code'),
                    text(' once ', 'bold'),
                    text('only', 'italic'),
                    text('.')
                )
            )
        );

        assert.equal(markdown, '**Run `init` once** _only_.');
    });

    it('widens the inline code fence around backticks', () => {
        const markdown = documentToMarkdown(
            documentOf(paragraph(text('html`x`', 'code')))
        );

        assert.equal(markdown, '`` html`x` ``');
    });

    it('fences what the codeBlock option reports as a code block', () => {
        const markdown = documentToMarkdown(
            documentOf(paragraph(text('const a = `b`;\n', 'code'))),
            { codeBlock: () => ({ code: 'const a = `b`;\n', language: 'ts' }) }
        );

        assert.equal(markdown, '```ts\nconst a = `b`;\n```');
    });

    it('lengthens the fence when the code holds a fence', () => {
        const markdown = documentToMarkdown(documentOf(paragraph(text(''))), {
            codeBlock: () => ({ code: '```\ninner\n```' })
        });

        assert.equal(markdown, '````\n```\ninner\n```\n````');
    });

    it('resolves link addresses through resolveUrl', () => {
        const markdown = documentToMarkdown(
            documentOf(
                paragraph(
                    text('See '),
                    block('hyperlink', [text('Routing')], {
                        uri: '/docs/routing#api'
                    }),
                    text('.')
                )
            ),
            { resolveUrl: (uri) => `https://site.test${uri}` }
        );

        assert.equal(
            markdown,
            'See [Routing](https://site.test/docs/routing#api).'
        );
    });

    it('nests lists under their item', () => {
        const markdown = documentToMarkdown(
            documentOf(
                block('unordered-list', [
                    block('list-item', [
                        paragraph(text('outer')),
                        block('unordered-list', [
                            block('list-item', [paragraph(text('inner'))])
                        ])
                    ]),
                    block('list-item', [paragraph(text('next'))])
                ]),
                block('ordered-list', [
                    block('list-item', [paragraph(text('one'))]),
                    block('list-item', [paragraph(text('two'))])
                ])
            )
        );

        assert.equal(
            markdown,
            '- outer\n    - inner\n- next\n\n1. one\n2. two'
        );
    });

    it('writes tables as pipe tables and escapes pipes in cells', () => {
        const cell = (nodeType, value) =>
            block(nodeType, [paragraph(text(value, 'code'))]);
        const markdown = documentToMarkdown(
            documentOf(
                block('table', [
                    block('table-row', [
                        cell('table-header-cell', 'Hook'),
                        cell('table-header-cell', 'Fires')
                    ]),
                    block('table-row', [
                        cell('table-cell', 'a | b'),
                        cell('table-cell', 'once')
                    ])
                ])
            )
        );

        assert.equal(
            markdown,
            '| `Hook` | `Fires` |\n| --- | --- |\n| `a \\| b` | `once` |'
        );
    });

    it('prefixes every line of a quote', () => {
        const markdown = documentToMarkdown(
            documentOf(
                block('blockquote', [
                    paragraph(text('first')),
                    paragraph(text('second'))
                ])
            )
        );

        assert.equal(markdown, '> first\n>\n> second');
    });

    it('throws on a node type it does not handle', () => {
        assert.throws(
            () =>
                documentToMarkdown(
                    documentOf(block('embedded-entry-block', []))
                ),
            /unsupported node type "embedded-entry-block"/
        );
    });
});

describe('inlineToMarkdown', () => {
    it('serializes one paragraph without block handling', () => {
        assert.equal(
            inlineToMarkdown(
                paragraph(text('loom is '), text('small', 'bold'))
            ),
            'loom is **small**'
        );
    });
});
