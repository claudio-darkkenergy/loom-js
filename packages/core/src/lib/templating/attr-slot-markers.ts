import { scanMarkup } from './scan-markup';

/** An attribute slot read from a chunk tail: the attribute's authored name, where that name starts in the chunk, and the quote opening its value (empty when unquoted). */
export interface AttrSlot {
    name: string;
    quote: string;
    start: number;
}

/** A template's attribute slots, keyed by token gap (the gap after `statics[i]`). */
export type AttrSlots = ReadonlyMap<number, AttrSlot>;

// A chunk ending on `name=`, `name="` or `name='`.
const ATTR_TAIL = /(?:^|[\s"'/])([^\s"'<>/=]+)\s*=\s*(["']?)$/;
// Cheap sniff for templates with no attribute slot at all.
const ATTR_TAIL_SNIFF = /=\s*["']?$/;
// What may follow an unquoted value.
const UNQUOTED_VALUE_END = /^[\s/>]/;
// ASCII only — some DOM implementations drop other characters from names.
const MARKER_PREFIX = 'loom-attr-slot-';
const ORDINAL = /^\d+$/;

/**
 * Reads the attribute a chunk tail ends on — `x=`, `x="`, `$click='`,
 * `xlink:href=` — or returns `null` when the tail ends on anything else.
 * It reads the text only; whether the tail sits inside an open tag is the
 * caller's to know.
 */
export const readAttrTail = (tail: string): AttrSlot | null => {
    const match = ATTR_TAIL.exec(tail);

    if (!match) {
        return null;
    }

    const [whole, name = '', quote = ''] = match;

    return { name, quote, start: match.index + whole.indexOf(name) };
};

/**
 * Finds the token gaps that are a whole attribute value inside an open tag.
 * A gap inside text, or one that is only part of a value (`class="a ${b}"`),
 * is not an attribute slot.
 */
export const scanAttrSlots = (statics: readonly string[]): AttrSlots => {
    const slots = new Map<number, AttrSlot>();
    const last = statics.length - 1;

    if (
        !statics.some(
            (chunk, chunkIndex) =>
                chunkIndex < last && ATTR_TAIL_SNIFF.test(chunk)
        )
    ) {
        return slots;
    }

    scanMarkup(statics, {
        gap: (chunkIndex, { inTag, quote }) => {
            const slot = inTag && readAttrTail(statics[chunkIndex] as string);
            const next = statics[chunkIndex + 1] as string;

            slot &&
                slot.quote === (quote ?? '') &&
                (slot.quote
                    ? next.startsWith(slot.quote)
                    : UNQUOTED_VALUE_END.test(next)) &&
                slots.set(chunkIndex, slot);
        }
    });

    return slots;
};

/** The valueless attribute an attribute slot parses as, named for its gap. */
export const attrMarker = (chunkIndex: number) =>
    `${MARKER_PREFIX}${chunkIndex}`;

/** The gap a parsed attribute name marks, or `-1` when it is no marker. */
export const readAttrMarker = (attrName: string) => {
    const ordinal = attrName.slice(MARKER_PREFIX.length);

    return attrName.startsWith(MARKER_PREFIX) && ORDINAL.test(ordinal)
        ? Number(ordinal)
        : -1;
};

/**
 * Joins the statics into one markup string. Each attribute slot is written
 * as its marker, so no attribute parses with the token as its value; every
 * other gap takes `gapText`.
 */
export const joinStatics = (
    statics: readonly string[],
    attrSlots: AttrSlots,
    gapText: (chunkIndex: number) => string
) => {
    const last = statics.length - 1;

    return statics
        .map((chunk, chunkIndex) => {
            // A quoted slot's closing quote opens the next chunk.
            const from = attrSlots.get(chunkIndex - 1)?.quote ? 1 : 0;
            const slot = chunkIndex < last && attrSlots.get(chunkIndex);

            if (slot) {
                return `${chunk.slice(from, slot.start)}${attrMarker(chunkIndex)} `;
            }

            return (
                chunk.slice(from) +
                (chunkIndex < last ? gapText(chunkIndex) : '')
            );
        })
        .join('');
};
