import {
    NAME_START,
    VOID_TAG,
    readName
} from './compile-component-tags/grammar';

// Table-scope scanning (`table-aware-template-parsing`): classifies a
// template's final statics before the native parser sees them, so table
// markup can take the template-element parse path and slot tokens in table
// content can be emitted as comment markers instead of being foster-parented
// out of the table. Runs once per template, at cache time.

export interface TableScope {
    // Any table tag appears — the template must parse via a template element.
    hasTableMarkup: boolean;
    // The first start tag is a table-part — body-context parsing would strip
    // the authored root.
    rootIsTablePart: boolean;
    // Token positions (the gap after `statics[i]`) sitting in table content,
    // where a character token would be foster-parented.
    tableContentTokens: Set<number>;
}

// Table-part tags — invalid as a body-context fragment root.
const TABLE_PART_TAG = /^(?:caption|col|colgroup|tbody|td|tfoot|th|thead|tr)$/;
// Any tag that puts the parser into a table insertion mode somewhere.
const TABLE_TAG = /^(?:caption|col|colgroup|table|tbody|td|tfoot|th|thead|tr)$/;
// Elements whose content model rejects character tokens — a slot token
// directly inside one needs a comment marker. `td`/`th`/`caption` allow text,
// so they are deliberately absent.
const TABLE_CONTENT_SCOPE = /^(?:colgroup|table|tbody|tfoot|thead|tr)$/;
// Cheap sniff for the no-table fast path — tag names never span chunk
// boundaries (interpolations sit only in text or attribute-value positions),
// so a per-chunk test is sound.
const TABLE_TAG_SNIFF =
    /<\/?(?:caption|col|colgroup|table|tbody|td|tfoot|th|thead|tr)[\s/>]/i;

const CELL_TAG = /^(?:td|th)$/;
const ROW_CONTEXT_TAG = /^(?:td|th|tr)$/;
const SECTION_TAG = /^(?:tbody|tfoot|thead)$/;

export const scanTableScope = (statics: readonly string[]): TableScope => {
    const tableContentTokens = new Set<number>();

    if (!statics.some((chunk) => TABLE_TAG_SNIFF.test(chunk))) {
        return {
            hasTableMarkup: false,
            rootIsTablePart: false,
            tableContentTokens
        };
    }

    const openTags: string[] = [];
    const last = statics.length - 1;
    let hasTableMarkup = false;
    let rootIsTablePart: boolean | null = null;
    // Scanner state persists across chunk boundaries — a token in an
    // attribute-value position leaves the scan mid-tag.
    let inComment = false;
    let inTag = false;
    let quote: string | null = null;
    let pendingTagName: string | null = null;

    const topTag = () => openTags[openTags.length - 1];
    const popWhile = (tagRe: RegExp) => {
        while (tagRe.test(topTag() ?? '')) {
            openTags.pop();
        }
    };
    // The HTML parser's implied end tags for table parts — enough to keep the
    // stack honest over markup with omitted `</td>`/`</tr>` closes.
    const applyImpliedCloses = (name: string) => {
        if (CELL_TAG.test(name)) {
            popWhile(CELL_TAG);
        } else if (name === 'tr') {
            popWhile(CELL_TAG);
            topTag() === 'tr' && openTags.pop();
        } else if (SECTION_TAG.test(name) || name === 'caption') {
            popWhile(ROW_CONTEXT_TAG);
            SECTION_TAG.test(topTag() ?? '') && openTags.pop();
        }
    };

    for (let chunkIndex = 0; chunkIndex < statics.length; chunkIndex++) {
        const text = statics[chunkIndex] as string;
        const len = text.length;
        let pos = 0;

        while (pos < len) {
            if (inComment) {
                const commentEnd = text.indexOf('-->', pos);

                if (commentEnd === -1) {
                    pos = len;
                } else {
                    inComment = false;
                    pos = commentEnd + 3;
                }

                continue;
            }

            if (inTag) {
                if (quote) {
                    const closeQuote = text.indexOf(quote, pos);

                    if (closeQuote === -1) {
                        pos = len;
                    } else {
                        quote = null;
                        pos = closeQuote + 1;
                    }

                    continue;
                }

                const char = text[pos] as string;

                if (char === '"' || char === "'") {
                    quote = char;
                } else if (char === '>') {
                    if (
                        pendingTagName &&
                        text[pos - 1] !== '/' &&
                        !VOID_TAG.test(pendingTagName)
                    ) {
                        openTags.push(pendingTagName);
                    }

                    pendingTagName = null;
                    inTag = false;
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
                inComment = true;
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
                    inTag = true;
                    pos = len;
                } else {
                    pos = closeAngle + 1;
                }

                continue;
            }

            if (nextChar !== undefined && NAME_START.test(nextChar)) {
                const nameEnd = readName(text, openAngle + 2);
                const name = text.slice(openAngle + 1, nameEnd).toLowerCase();

                if (rootIsTablePart === null) {
                    rootIsTablePart = TABLE_PART_TAG.test(name);
                }

                if (TABLE_TAG.test(name)) {
                    hasTableMarkup = true;
                }

                applyImpliedCloses(name);
                inTag = true;
                pendingTagName = name;
                pos = nameEnd;
                continue;
            }

            pos = openAngle + 1;
        }

        // Classify the token gap after this chunk: a text-position token whose
        // nearest open element is table content needs a comment marker.
        if (
            chunkIndex < last &&
            !inTag &&
            !inComment &&
            TABLE_CONTENT_SCOPE.test(topTag() ?? '')
        ) {
            tableContentTokens.add(chunkIndex);
        }
    }

    return {
        hasTableMarkup,
        rootIsTablePart: rootIsTablePart ?? false,
        tableContentTokens
    };
};
