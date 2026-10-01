import {
    type Block,
    helpers,
    type Inline,
    MARKS,
    type Text
} from '@contentful/rich-text-types';
import type { TemplateTagValue } from '@loom-js/core';
import { codeTokenizer } from '@loom-js/highlight';
import { PinkCodePanel, resolveCodePanelTab } from '@loom-js/pink';

import { codeTabGroup } from '../../../../logic/activity/code-tab-group';

export interface CodeTab {
    group?: string;
    label: string;
}

export interface CodeBlock {
    code: string;
    language?: string;
    tab?: CodeTab;
}

type TabbedCodeBlock = CodeBlock & { tab: CodeTab };

// The authoring convention (content map, `align-loom-docs-with-core-readme`):
// a paragraph whose entire content carries the `code` mark is a code block —
// when it's multi-line, or when its first line is a `// @lang <label>`
// directive (stripped here; the label becomes the panel header). Single-line
// code-marked paragraphs without the directive stay inline (e.g. table cells).
const langDirectiveRe = /^\/\/\s*@lang\s+(\S+)\s*\r?\n?/;
// An optional second directive line, `// @tab <label> [<group>]`, marks the
// block as one variant of a tabbed panel — see `groupCodeTabs`.
const tabDirectiveRe = /^\/\/[ \t]*@tab[ \t]+(\S+)(?:[ \t]+(\S+))?[ \t]*\r?\n?/;

const parseTabDirective = (source: string): Pick<CodeBlock, 'code' | 'tab'> => {
    const tabMatch = source.match(tabDirectiveRe);
    const [directive, label, group] = tabMatch ?? [];

    return directive !== undefined && label
        ? { code: source.slice(directive.length), tab: { group, label } }
        : { code: source };
};

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
            ...parseTabDirective(
                soleNode.value.slice(directiveMatch[0].length)
            ),
            language: directiveMatch[1]
        };
    }

    return soleNode.value.includes('\n') ? { code: soleNode.value } : undefined;
};

const CodeContent = ({ code, language }: CodeBlock) =>
    PinkCodePanel.Content({
        children: code,
        language,
        tokenize: codeTokenizer(),
        useLineNumbers: code.includes('\n')
    });

export const CodeSample = ({ code, language }: CodeBlock) =>
    PinkCodePanel({
        children: [
            PinkCodePanel.Header({
                children: [
                    language ?? '',
                    PinkCodePanel.CopyButton({ text: code })
                ]
            }),
            CodeContent({ code, language })
        ]
    });

// One panel over several variants of the same code. The selection drives the
// tabs, the language label, the visible variant and the copied text.
export const TabbedCodeSample = (
    defaultVariant: TabbedCodeBlock,
    otherVariants: TabbedCodeBlock[]
) => {
    const variants = [defaultVariant, ...otherVariants];
    const labels = variants.map(({ tab }) => tab.label);
    const selection = codeTabGroup(
        defaultVariant.tab.group,
        defaultVariant.tab.label
    );
    const activeVariant = (selectedLabel: string) => {
        const activeLabel = resolveCodePanelTab(labels, selectedLabel);

        return (
            variants.find(({ tab }) => tab.label === activeLabel) ??
            defaultVariant
        );
    };

    return PinkCodePanel({
        children: [
            PinkCodePanel.Header({
                children: [
                    selection.effect(
                        ({ value }) => activeVariant(value).language ?? ''
                    ),
                    PinkCodePanel.Tabs({ labels, selection }),
                    PinkCodePanel.CopyButton({
                        text: () => activeVariant(selection.value()).code
                    })
                ]
            }),
            selection.effect(({ value }) => CodeContent(activeVariant(value)))
        ]
    });
};

const asTabbedCodeBlock = (
    blockNode: Block | Inline | Text
): TabbedCodeBlock | undefined => {
    const codeBlock =
        !helpers.isText(blockNode) && blockNode.nodeType === 'paragraph'
            ? asCodeBlock(blockNode)
            : undefined;

    return codeBlock?.tab ? { ...codeBlock, tab: codeBlock.tab } : undefined;
};

/**
 * Merges each run of consecutive tab-directive code blocks into one tabbed
 * panel. `renderedNodes` are the blocks' own renders, index-aligned with
 * `blockNodes`; everything outside a run — a lone tab block included — keeps
 * its own render.
 */
export const groupCodeTabs = (
    blockNodes: (Block | Inline | Text)[],
    renderedNodes: TemplateTagValue[]
): TemplateTagValue[] => {
    const groupedNodes: TemplateTagValue[] = [];
    let nodeIndex = 0;

    while (nodeIndex < blockNodes.length) {
        const runVariants: TabbedCodeBlock[] = [];
        let runEnd = nodeIndex;
        let variant = asTabbedCodeBlock(blockNodes[runEnd]!);

        while (variant) {
            runVariants.push(variant);
            runEnd += 1;

            const nextNode = blockNodes[runEnd];

            variant = nextNode && asTabbedCodeBlock(nextNode);
        }

        const [defaultVariant, ...otherVariants] = runVariants;

        if (defaultVariant && otherVariants.length) {
            groupedNodes.push(TabbedCodeSample(defaultVariant, otherVariants));
            nodeIndex = runEnd;
        } else {
            groupedNodes.push(renderedNodes[nodeIndex]);
            nodeIndex += 1;
        }
    }

    return groupedNodes;
};
