import type { ContentfulDocument, RichTextNode } from '@loom-js/contentful';
import { toKebabCase } from '@loom-js/utils';

// Kebab + punctuation strip = GitHub's slugger, so docs and README anchors
// match. The one helper both the heading and the TOC use.
export const headingAnchorId = (headingText: string) =>
    toKebabCase(headingText).replace(/[^a-z0-9-_]/g, '');

export type HeadingAnchorLevel = 2 | 3;

export type HeadingAnchor = {
    // Unique within the document (occurrence-suffixed on repeats).
    id: string;
    level: HeadingAnchorLevel;
    // The renderer's lookup key.
    node: RichTextNode;
    text: string;
};

export type HeadingAnchors = {
    entries: HeadingAnchor[];
    // `undefined` for nodes the pass didn't see.
    idOf: (node: RichTextNode) => string | undefined;
};

const ANCHORED_LEVELS: Record<string, HeadingAnchorLevel> = {
    'heading-2': 2,
    'heading-3': 3
};

// Inline marks split a heading into several text nodes; the id reads them
// concatenated.
const headingText = (node: RichTextNode): string =>
    'value' in node
        ? node.value
        : node.content.map((child) => headingText(child)).join('');

/** One pass over the top-level h2/h3 nodes, shared by renderer and TOC. */
export const collectHeadingAnchors = (
    document?: ContentfulDocument
): HeadingAnchors => {
    const entries: HeadingAnchor[] = [];
    const ids = new Map<RichTextNode, string>();
    const seen = new Map<string, number>();

    for (const node of document?.content ?? []) {
        const level = ANCHORED_LEVELS[node.nodeType];

        if (!level) {
            continue;
        }

        const text = headingText(node);
        const base = headingAnchorId(text);
        const occurrence = seen.get(base) ?? 0;
        // GitHub's dedupe: bare id first, then `-1`, `-2`, … in order.
        const id = occurrence ? `${base}-${occurrence}` : base;

        seen.set(base, occurrence + 1);
        ids.set(node, id);
        entries.push({ id, level, node, text });
    }

    return { entries, idOf: (node) => ids.get(node) };
};
