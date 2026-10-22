import type {
    Block,
    Document,
    Inline,
    Text
} from '@contentful/rich-text-types';

type RichTextNode = Block | Inline | Text;

export interface TextOptions {
    /**
     * Decides whether a paragraph is a code block — those are left out, so
     * the text carries prose only. Same convention as `documentToMarkdown`.
     */
    codeBlock?: (paragraphNode: Block) => unknown;
}

const INLINE_TYPES = new Set(['hyperlink', 'text']);
// Containers whose children read as one run of prose, joined by spaces.
const CONTAINER_TYPES = new Set([
    'blockquote',
    'list-item',
    'ordered-list',
    'table',
    'table-cell',
    'table-header-cell',
    'table-row',
    'unordered-list'
]);

const isText = (node: RichTextNode): node is Text => node.nodeType === 'text';

const unsupported = (node: RichTextNode): never => {
    throw new Error(
        `[rich-text-text] unsupported node type "${node.nodeType}"`
    );
};

const joinText = (nodes: RichTextNode[], options: TextOptions) =>
    nodes
        .map((node) => nodeToText(node, options))
        .filter(Boolean)
        .join(' ');

/**
 * The plain text of one rich-text node — marks and link addresses dropped,
 * nested blocks joined with single spaces. A code-block paragraph (per
 * `options.codeBlock`) and an `hr` read as empty. Throws on a node type it
 * does not handle, so content never drops out unnoticed.
 */
export const nodeToText = (
    node: RichTextNode,
    options: TextOptions = {}
): string => {
    if (isText(node)) {
        return node.value;
    }

    if (
        INLINE_TYPES.has(node.nodeType) ||
        /^heading-[1-6]$/.test(node.nodeType)
    ) {
        return node.content.map((child) => nodeToText(child, options)).join('');
    }

    if (node.nodeType === 'paragraph') {
        return options.codeBlock?.(node)
            ? ''
            : node.content.map((child) => nodeToText(child, options)).join('');
    }

    if (CONTAINER_TYPES.has(node.nodeType)) {
        return joinText(node.content, options);
    }

    if (node.nodeType === 'hr') {
        return '';
    }

    return unsupported(node);
};

/** The plain text of a whole document, blocks joined with single spaces. */
export const documentToText = (
    richTextDocument: Document,
    options: TextOptions = {}
) => joinText(richTextDocument.content, options);
