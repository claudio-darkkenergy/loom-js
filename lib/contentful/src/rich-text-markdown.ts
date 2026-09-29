import type {
    Block,
    Document,
    Inline,
    Text
} from '@contentful/rich-text-types';

type MarkdownNode = Block | Inline | Text;

export interface MarkdownCodeBlock {
    code: string;
    language?: string;
}

export interface MarkdownOptions {
    /**
     * Decides whether a paragraph is a code block. Rich text has no code
     * block node, so the convention belongs to the content's author.
     */
    codeBlock?: (paragraphNode: Block) => MarkdownCodeBlock | undefined;
    /** Rewrites a link's address, e.g. to make site-relative links absolute. */
    resolveUrl?: (uri: string) => string;
}

const LIST_INDENT = '    ';
// Outermost first; the code mark always wraps innermost.
const wrappingMarks = [
    { marker: '**', type: 'bold' },
    { marker: '_', type: 'italic' }
];

const isText = (node: MarkdownNode): node is Text => node.nodeType === 'text';

const hasMark = (node: MarkdownNode, markType: string) =>
    isText(node) && node.marks.some((mark) => mark.type === markType);

const longestBacktickRun = (value: string) =>
    Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length));

const inlineCode = (value: string) => {
    const fence = '`'.repeat(longestBacktickRun(value) + 1);
    const padding = /^`|`$/.test(value) ? ' ' : '';

    return `${fence}${padding}${value}${padding}${fence}`;
};

// Markers must hug their text, so edge whitespace moves outside them.
const wrap = (value: string, marker: string) => {
    const [, leading = '', body = '', trailing = ''] =
        value.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? [];

    return body ? `${leading}${marker}${body}${marker}${trailing}` : value;
};

const unsupported = (node: MarkdownNode): never => {
    throw new Error(
        `[rich-text-markdown] unsupported node type "${node.nodeType}"`
    );
};

const inlineNode = (node: MarkdownNode, options: MarkdownOptions): string => {
    if (isText(node)) {
        return hasMark(node, 'code') ? inlineCode(node.value) : node.value;
    }

    if (node.nodeType === 'hyperlink') {
        const uri = String(node.data.uri ?? '');

        return `[${inlineNodes(node.content, options)}](${
            options.resolveUrl?.(uri) ?? uri
        })`;
    }

    return unsupported(node);
};

/**
 * Serializes a run of inline nodes. Neighbors sharing a mark are wrapped
 * once as a group, so bold text holding inline code stays one bold span.
 */
const inlineNodes = (
    nodes: MarkdownNode[],
    options: MarkdownOptions,
    markIndex = 0
): string => {
    const wrappingMark = wrappingMarks[markIndex];

    if (!wrappingMark) {
        return nodes.map((node) => inlineNode(node, options)).join('');
    }

    const groups: { marked: boolean; nodes: MarkdownNode[] }[] = [];

    nodes.forEach((node) => {
        const marked = hasMark(node, wrappingMark.type);
        const openGroup = groups.at(-1);

        if (openGroup && openGroup.marked === marked) {
            openGroup.nodes.push(node);
        } else {
            groups.push({ marked, nodes: [node] });
        }
    });

    return groups
        .map((group) => {
            const value = inlineNodes(group.nodes, options, markIndex + 1);

            return group.marked ? wrap(value, wrappingMark.marker) : value;
        })
        .join('');
};

const fencedCode = ({ code, language = '' }: MarkdownCodeBlock) => {
    const fence = '`'.repeat(Math.max(3, longestBacktickRun(code) + 1));

    return `${fence}${language}\n${code.replace(/\n+$/, '')}\n${fence}`;
};

const indent = (value: string, prefix: string) =>
    value
        .split('\n')
        .map((line) => (line ? prefix.concat(line) : line))
        .join('\n');

const list = (listNode: Block, options: MarkdownOptions) =>
    listNode.content
        .map((itemNode, itemIndex) => {
            const marker =
                listNode.nodeType === 'ordered-list'
                    ? `${itemIndex + 1}. `
                    : '- ';
            const [first = '', ...rest] = (itemNode as Block).content.map(
                (childNode) => blockNode(childNode as Block, options)
            );

            return [
                marker.concat(first),
                ...rest.map((value) => indent(value, LIST_INDENT))
            ].join('\n');
        })
        .join('\n');

const tableRow = (rowNode: Block, options: MarkdownOptions) => {
    const cells = rowNode.content.map((cellNode) =>
        (cellNode as Block).content
            .map((childNode) => blockNode(childNode as Block, options))
            .join(' ')
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
    );

    return `| ${cells.join(' | ')} |`;
};

const table = (tableNode: Block, options: MarkdownOptions) => {
    const [headerNode, ...bodyNodes] = tableNode.content as Block[];

    if (!headerNode) {
        return '';
    }

    return [
        tableRow(headerNode, options),
        `| ${headerNode.content.map(() => '---').join(' | ')} |`,
        ...bodyNodes.map((rowNode) => tableRow(rowNode, options))
    ].join('\n');
};

const blocks = (nodes: MarkdownNode[], options: MarkdownOptions) =>
    nodes
        .map((node) => blockNode(node as Block, options))
        .filter(Boolean)
        .join('\n\n');

const blockNode = (node: Block, options: MarkdownOptions): string => {
    const headingLevel = node.nodeType.match(/^heading-([1-6])$/)?.[1];

    switch (true) {
        case Boolean(headingLevel):
            return `${'#'.repeat(Number(headingLevel))} ${inlineNodes(
                node.content,
                options
            )}`;
        case node.nodeType === 'paragraph': {
            const codeBlock = options.codeBlock?.(node);

            return codeBlock
                ? fencedCode(codeBlock)
                : inlineNodes(node.content, options);
        }
        case node.nodeType === 'unordered-list':
        case node.nodeType === 'ordered-list':
            return list(node, options);
        case node.nodeType === 'blockquote':
            return blocks(node.content, options)
                .split('\n')
                .map((line) => (line ? `> ${line}` : '>'))
                .join('\n');
        case node.nodeType === 'table':
            return table(node, options);
        case node.nodeType === 'hr':
            return '---';
        default:
            return unsupported(node);
    }
};

/**
 * Serializes a Contentful rich-text document to markdown. Throws on a node
 * type it does not handle, so content never drops out unnoticed.
 */
export const documentToMarkdown = (
    richTextDocument: Document,
    options: MarkdownOptions = {}
) => blocks(richTextDocument.content, options);

/** The text of an inline run as markdown, e.g. a lead paragraph. */
export const inlineToMarkdown = (
    paragraphNode: Block,
    options: MarkdownOptions = {}
) => inlineNodes(paragraphNode.content, options);
