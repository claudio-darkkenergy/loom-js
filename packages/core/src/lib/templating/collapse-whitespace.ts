import {
    NAME_START,
    VOID_TAG,
    readName
} from './compile-component-tags/grammar';

// Template whitespace collapse: a static whitespace run containing a newline
// is formatting, one without is authored content. Runs once per template, at
// cache time, over the final statics.

// What sits before or after a text segment. A boundary is the edge of a child
// list (or of the template); everything else is a content item.
type Neighbor = 'boundary' | 'content';

// Elements whose text content is never markup — skipped to their end tag.
const RAW_TEXT_TAG = /^(?:script|style|textarea|title)$/;
const CROSS_LINE_RUN = /[ \t\f]*[\n\r][ \t\n\r\f]*/g;
const NEWLINE = /[\n\r]/;

const collapseText = (text: string, before: Neighbor, after: Neighbor) =>
    text.replace(CROSS_LINE_RUN, (run, offset: number) => {
        const atStart = offset === 0 && before === 'boundary';
        const atEnd =
            offset + run.length === text.length && after === 'boundary';

        return atStart || atEnd ? '' : ' ';
    });

// The position of the next tag or comment opener, or `-1` — a `<` that opens
// neither is text.
const findMarkup = (text: string, from: number) => {
    let openAngle = text.indexOf('<', from);

    while (openAngle > -1) {
        const nextChar = text[openAngle + 1];

        if (
            nextChar !== undefined &&
            (nextChar === '/' || nextChar === '!' || NAME_START.test(nextChar))
        ) {
            return openAngle;
        }

        openAngle = text.indexOf('<', openAngle + 1);
    }

    return -1;
};

/**
 * Collapses the formatting whitespace out of a template's statics. A
 * whitespace run containing a newline becomes one space between content
 * items and nothing at the start or end of a child list. Whitespace without
 * a newline, inside tags, and inside `pre`, `textarea`, `script`, and
 * `style` is kept as written. Returns the same array when nothing changes.
 */
export const collapseWhitespace = (
    statics: readonly string[]
): readonly string[] => {
    if (!statics.some((chunk) => NEWLINE.test(chunk))) {
        return statics;
    }

    const last = statics.length - 1;
    // Scanner state persists across chunk boundaries — a slot can sit in an
    // attribute value, a comment, or a verbatim element.
    let before: Neighbor = 'boundary';
    let inComment = false;
    let inTag = false;
    let pendingTagName: string | null = null;
    let preDepth = 0;
    let quote: string | null = null;
    let rawTextTag: string | null = null;

    const collapsed = statics.map((text, chunkIndex) => {
        const len = text.length;
        let output = '';
        let pos = 0;

        const copyTo = (end: number) => {
            output += text.slice(pos, end);
            pos = end;
        };

        while (pos < len) {
            if (inComment) {
                const commentEnd = text.indexOf('-->', pos);

                inComment = commentEnd === -1;
                copyTo(inComment ? len : commentEnd + 3);
                continue;
            }

            if (inTag) {
                if (quote) {
                    const closeQuote = text.indexOf(quote, pos);

                    if (closeQuote === -1) {
                        copyTo(len);
                    } else {
                        quote = null;
                        copyTo(closeQuote + 1);
                    }

                    continue;
                }

                const char = text[pos] as string;

                if (char === '"' || char === "'") {
                    quote = char;
                } else if (char === '>') {
                    const openedTagName =
                        pendingTagName &&
                        text[pos - 1] !== '/' &&
                        !VOID_TAG.test(pendingTagName)
                            ? pendingTagName
                            : null;

                    if (openedTagName === 'pre') {
                        preDepth++;
                    }

                    if (openedTagName && RAW_TEXT_TAG.test(openedTagName)) {
                        rawTextTag = openedTagName;
                    }

                    before = openedTagName ? 'boundary' : 'content';
                    pendingTagName = null;
                    inTag = false;
                }

                copyTo(pos + 1);
                continue;
            }

            if (rawTextTag) {
                const rawEnd = text
                    .toLowerCase()
                    .indexOf(`</${rawTextTag}`, pos);

                if (rawEnd === -1) {
                    copyTo(len);
                    continue;
                }

                rawTextTag = null;
                copyTo(rawEnd);
            }

            const markup = findMarkup(text, pos);
            const textEnd = markup === -1 ? len : markup;

            if (textEnd > pos) {
                const segment = text.slice(pos, textEnd);
                // A chunk's end is a slot, the last chunk's is the template's.
                const closesChildList =
                    markup === -1
                        ? chunkIndex === last
                        : text[markup + 1] === '/';
                const segmentOutput = preDepth
                    ? segment
                    : collapseText(
                          segment,
                          before,
                          closesChildList ? 'boundary' : 'content'
                      );

                if (segmentOutput) {
                    before = 'content';
                }

                output += segmentOutput;
                pos = textEnd;
            }

            if (markup === -1) {
                continue;
            }

            if (text.startsWith('<!--', markup)) {
                before = 'content';
                inComment = true;
                copyTo(markup + 4);
                continue;
            }

            const isEndTag = text[markup + 1] === '/';
            const nameStart = markup + (isEndTag ? 2 : 1);
            const nameEnd = readName(text, nameStart);
            const name = text.slice(nameStart, nameEnd).toLowerCase();

            if (isEndTag && name === 'pre' && preDepth) {
                preDepth--;
            }

            // Only a named start tag can open a child list — anything else
            // resolves to a content item at its `>`.
            pendingTagName = isEndTag || !name ? null : name;
            inTag = true;
            copyTo(nameEnd);
        }

        // The slot after this chunk is a content item when it sits in a text
        // position.
        if (chunkIndex < last && !inTag && !inComment && !rawTextTag) {
            before = 'content';
        }

        return output;
    });

    return collapsed.some((chunk, chunkIndex) => chunk !== statics[chunkIndex])
        ? collapsed
        : statics;
};
