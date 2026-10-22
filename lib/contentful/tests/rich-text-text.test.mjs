import { describe, it } from 'node:test';

import { documentToText, nodeToText } from '../src/rich-text-text.ts';
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

describe('nodeToText', () => {
    it('concatenates inline text, dropping marks and link syntax', () => {
        const value = nodeToText(
            paragraph(
                text('Run ', 'bold'),
                text('init', 'code'),
                block('hyperlink', [text(' once')], { uri: '/docs/x' }),
                text('.')
            )
        );

        assert.equal(value, 'Run init once.');
    });

    it('joins list items and table cells with spaces', () => {
        const list = block('unordered-list', [
            block('list-item', [paragraph(text('one'))]),
            block('list-item', [paragraph(text('two'))])
        ]);
        const table = block('table', [
            block('table-row', [
                block('table-header-cell', [paragraph(text('Prop'))]),
                block('table-header-cell', [paragraph(text('Type'))])
            ]),
            block('table-row', [
                block('table-cell', [paragraph(text('size'))]),
                block('table-cell', [paragraph(text('string'))])
            ])
        ]);

        assert.equal(nodeToText(list), 'one two');
        assert.equal(nodeToText(table), 'Prop Type size string');
    });

    it('skips a paragraph the codeBlock option claims', () => {
        const codeParagraph = paragraph(
            text('const a = 1;\nconst b = 2;', 'code')
        );

        assert.equal(
            nodeToText(codeParagraph, {
                codeBlock: (node) => node.content[0]?.value.includes('\n')
            }),
            ''
        );
        assert.equal(nodeToText(codeParagraph), 'const a = 1;\nconst b = 2;');
    });

    it('throws on an unsupported node type', () => {
        assert.throws(
            () => nodeToText(block('embedded-asset-block', [])),
            /unsupported node type "embedded-asset-block"/
        );
    });
});

describe('documentToText', () => {
    it('joins top-level blocks with single spaces, dropping empty ones', () => {
        const value = documentToText(
            documentOf(
                paragraph(text('Lead.')),
                block('hr', []),
                block('heading-2', [text('Install')]),
                block('blockquote', [paragraph(text('Note.'))])
            )
        );

        assert.equal(value, 'Lead. Install Note.');
    });
});
