// The row generator every implementation shares. Seeded, so the labels a
// framework renders for a given operation sequence match every other
// framework's — the runner compares identical work, not identical-looking work.

export interface Row {
    id: number;
    label: string;
}

const ADJECTIVES = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy'
];
const COLOURS = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange'
];
const NOUNS = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard'
];

// mulberry32 — small, deterministic, good enough for label picking.
const createRandom = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let next = Math.imul(seed ^ (seed >>> 15), 1 | seed);

    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
};

const random = createRandom(0x10ca1);
const pick = <Item>(items: Item[]): Item =>
    items[Math.floor(random() * items.length)] as Item;

let nextId = 1;

/** `count` fresh rows with ascending ids, continuing from the last call. */
export const buildData = (count: number): Row[] => {
    const rows: Row[] = [];

    for (let index = 0; index < count; index += 1) {
        rows.push({
            id: nextId,
            label: `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}`
        });
        nextId += 1;
    }

    return rows;
};

/** The suffix `partialUpdate` appends to every 10th label. */
export const UPDATE_SUFFIX = ' !!!';

/** Rows 0, 10, 20… get the suffix; everything else is returned as-is. */
export const updateEveryTenth = (rows: Row[]): Row[] =>
    rows.map((row, index) =>
        index % 10 === 0 ? { ...row, label: row.label + UPDATE_SUFFIX } : row
    );

/** Rows 1 and 998 trade places (when there are enough rows). */
export const swapSecondAndPenultimate = (rows: Row[]): Row[] => {
    if (rows.length <= 998) {
        return rows;
    }

    const swapped = rows.slice();
    const second = swapped[1] as Row;

    swapped[1] = swapped[998] as Row;
    swapped[998] = second;

    return swapped;
};
