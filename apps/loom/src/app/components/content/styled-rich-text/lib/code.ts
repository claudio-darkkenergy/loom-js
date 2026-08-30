import {
    type Block,
    helpers,
    type Inline,
    MARKS
} from '@contentful/rich-text-types';
import { PinkCodePanel } from '@loom-js/pink';

export interface CodeBlock {
    code: string;
    language?: string;
}

// The authoring convention (content map, `align-loom-docs-with-core-readme`):
// a paragraph whose entire content carries the `code` mark is a code block —
// when it's multi-line, or when its first line is a `// @lang <label>`
// directive (stripped here; the label becomes the panel header). Single-line
// code-marked paragraphs without the directive stay inline (e.g. table cells).
const langDirectiveRe = /^\/\/\s*@lang\s+(\S+)\s*\r?\n?/;

export const asCodeBlock = (
    paragraphNode: Block | Inline
): CodeBlock | undefined => {
    const contentNodes = paragraphNode.content.filter(
        (childNode) => !(helpers.isText(childNode) && childNode.value === '')
    );
    const [soleNode] = contentNodes;

    if (
        contentNodes.length !== 1 ||
        !soleNode ||
        !helpers.isText(soleNode) ||
        !soleNode.marks.some((mark) => mark.type === MARKS.CODE)
    ) {
        return undefined;
    }

    const directiveMatch = soleNode.value.match(langDirectiveRe);

    if (directiveMatch) {
        return {
            code: soleNode.value.slice(directiveMatch[0].length),
            language: directiveMatch[1]
        };
    }

    return soleNode.value.includes('\n') ? { code: soleNode.value } : undefined;
};

export const CodeSample = ({ code, language }: CodeBlock) =>
    PinkCodePanel({
        children: [
            PinkCodePanel.Header({
                children: [
                    language ?? '',
                    PinkCodePanel.CopyButton({ text: code })
                ]
            }),
            PinkCodePanel.Content({
                children: code,
                useLineNumbers: code.includes('\n')
            })
        ]
    });
