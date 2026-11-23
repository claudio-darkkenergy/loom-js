import {
    NAME_START,
    VOID_TAG,
    readName
} from './compile-component-tags/grammar';

/** Where the scan stands at a moment: inside a comment, an open tag, a quoted attribute value, and the stack of open elements. */
export interface MarkupState {
    inComment: boolean;
    inTag: boolean;
    openTags: string[];
    quote: string | null;
}

/** Hooks a markup scan calls as it goes. */
export interface MarkupVisitor {
    // A start tag's name was read (lowercased); its attributes follow.
    startTag?: (name: string, state: MarkupState) => void;
    // The token gap after `statics[chunkIndex]` was reached.
    gap?: (chunkIndex: number, state: MarkupState) => void;
}

/**
 * Walks a template's statics as markup — comments, open tags, quoted
 * attribute values, start and end tags — carrying the state across the
 * token gaps, and reports each start tag and each gap to the visitor.
 */
export const scanMarkup = (
    statics: readonly string[],
    visitor: MarkupVisitor
) => {
    const state: MarkupState = {
        inComment: false,
        inTag: false,
        openTags: [],
        quote: null
    };
    const { openTags } = state;
    const last = statics.length - 1;
    let pendingTagName: string | null = null;

    for (let chunkIndex = 0; chunkIndex < statics.length; chunkIndex++) {
        const text = statics[chunkIndex] as string;
        const len = text.length;
        let pos = 0;

        while (pos < len) {
            if (state.inComment) {
                const commentEnd = text.indexOf('-->', pos);

                if (commentEnd === -1) {
                    pos = len;
                } else {
                    state.inComment = false;
                    pos = commentEnd + 3;
                }

                continue;
            }

            if (state.inTag) {
                if (state.quote) {
                    const closeQuote = text.indexOf(state.quote, pos);

                    if (closeQuote === -1) {
                        pos = len;
                    } else {
                        state.quote = null;
                        pos = closeQuote + 1;
                    }

                    continue;
                }

                const char = text[pos] as string;

                if (char === '"' || char === "'") {
                    state.quote = char;
                } else if (char === '>') {
                    if (
                        pendingTagName &&
                        text[pos - 1] !== '/' &&
                        !VOID_TAG.test(pendingTagName)
                    ) {
                        openTags.push(pendingTagName);
                    }

                    pendingTagName = null;
                    state.inTag = false;
                }

                pos++;
                continue;
            }

            const openAngle = text.indexOf('<', pos);

            if (openAngle === -1) {
                pos = len;
                continue;
            }

            if (text.startsWith('<!--', openAngle)) {
                state.inComment = true;
                pos = openAngle + 4;
                continue;
            }

            const nextChar = text[openAngle + 1];

            if (nextChar === '/') {
                // End tag — pop to the nearest matching open (implied closes
                // recover), then skip past `>`.
                const nameEnd = readName(text, openAngle + 2);
                const name = text.slice(openAngle + 2, nameEnd).toLowerCase();
                const openIndex = openTags.lastIndexOf(name);

                if (openIndex > -1) {
                    openTags.length = openIndex;
                }

                const closeAngle = text.indexOf('>', nameEnd);

                if (closeAngle === -1) {
                    state.inTag = true;
                    pos = len;
                } else {
                    pos = closeAngle + 1;
                }

                continue;
            }

            if (nextChar !== undefined && NAME_START.test(nextChar)) {
                const nameEnd = readName(text, openAngle + 2);
                const name = text.slice(openAngle + 1, nameEnd).toLowerCase();

                visitor.startTag?.(name, state);
                state.inTag = true;
                pendingTagName = name;
                pos = nameEnd;
                continue;
            }

            pos = openAngle + 1;
        }

        chunkIndex < last && visitor.gap?.(chunkIndex, state);
    }
};
