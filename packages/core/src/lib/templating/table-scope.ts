import { scanMarkup } from './scan-markup';

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

const topTag = (openTags: string[]) => openTags[openTags.length - 1];
const popWhile = (openTags: string[], tagRe: RegExp) => {
    while (tagRe.test(topTag(openTags) ?? '')) {
        openTags.pop();
    }
};
// The HTML parser's implied end tags for table parts — enough to keep the
// stack honest over markup with omitted `</td>`/`</tr>` closes.
const applyImpliedCloses = (openTags: string[], name: string) => {
    if (CELL_TAG.test(name)) {
        popWhile(openTags, CELL_TAG);
    } else if (name === 'tr') {
        popWhile(openTags, CELL_TAG);
        topTag(openTags) === 'tr' && openTags.pop();
    } else if (SECTION_TAG.test(name) || name === 'caption') {
        popWhile(openTags, ROW_CONTEXT_TAG);
        SECTION_TAG.test(topTag(openTags) ?? '') && openTags.pop();
    }
};

export const scanTableScope = (statics: readonly string[]): TableScope => {
    const tableContentTokens = new Set<number>();

    if (!statics.some((chunk) => TABLE_TAG_SNIFF.test(chunk))) {
        return {
            hasTableMarkup: false,
            rootIsTablePart: false,
            tableContentTokens
        };
    }

    let hasTableMarkup = false;
    let rootIsTablePart: boolean | null = null;

    scanMarkup(statics, {
        startTag: (name, { openTags }) => {
            if (rootIsTablePart === null) {
                rootIsTablePart = TABLE_PART_TAG.test(name);
            }

            if (TABLE_TAG.test(name)) {
                hasTableMarkup = true;
            }

            applyImpliedCloses(openTags, name);
        },
        // A text-position token whose nearest open element is table content
        // needs a comment marker.
        gap: (chunkIndex, { inComment, inTag, openTags }) => {
            !inTag &&
                !inComment &&
                TABLE_CONTENT_SCOPE.test(topTag(openTags) ?? '') &&
                tableContentTokens.add(chunkIndex);
        }
    });

    return {
        hasTableMarkup,
        rootIsTablePart: rootIsTablePart ?? false,
        tableContentTokens
    };
};
