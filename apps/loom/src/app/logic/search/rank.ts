import type { SearchEntry } from '../../../../project/client/search-index.mjs';

export interface RankedResult {
    entry: SearchEntry;
    score: number;
    snippet: string;
}

// Field weights: a title hit outranks a heading hit outranks a text hit.
// Every section carries its topic's title, so the title counts fully on
// the lead entry only — a query naming the topic lands on the topic.
const fieldWeights = (
    entry: SearchEntry
): [field: keyof SearchEntry, weight: number][] => [
    ['title', entry.level === 0 ? 3 : 1],
    ['heading', 2],
    ['text', 1]
];
const SNIPPET_LENGTH = 120;
const ELLIPSIS = '…';

/** The query as lowercase word tokens. */
export const tokenize = (query: string) =>
    query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);

const words = (value: string) => tokenize(value);

// A token hits a field when some word in it starts with the token.
const hits = (fieldWords: string[], token: string) =>
    fieldWords.some((word) => word.startsWith(token));

const scoreEntry = (entry: SearchEntry, tokens: string[], query: string) => {
    const fields = fieldWeights(entry).map(([field, weight]) => ({
        value: String(entry[field]).toLowerCase(),
        weight,
        words: words(String(entry[field]))
    }));
    let score = 0;

    for (const token of tokens) {
        const hitFields = fields.filter(({ words: fieldWords }) =>
            hits(fieldWords, token)
        );

        // Every token must land somewhere, else the entry is out.
        if (!hitFields.length) {
            return 0;
        }

        score += hitFields.reduce((sum, { weight }) => sum + weight, 0);
    }

    // The whole phrase, contiguous, counts once more per field it sits in.
    if (tokens.length > 1) {
        score += fields
            .filter(({ value }) => value.includes(query))
            .reduce((sum, { weight }) => sum + weight, 0);
    }

    return score;
};

const trimTo = (value: string, length: number) =>
    value.length > length
        ? value
              .slice(0, length - ELLIPSIS.length)
              .trimEnd()
              .concat(ELLIPSIS)
        : value;

/**
 * The sentence of `text` holding the first token hit, else the opening
 * text — either way trimmed to the snippet length.
 */
export const snippet = (text: string, query: string) => {
    const tokens = tokenize(query);
    const sentences = text.split(/(?<=[.!?])\s+/);
    const hit = sentences.find((sentence) => {
        const sentenceWords = words(sentence);

        return tokens.some((token) => hits(sentenceWords, token));
    });

    return trimTo(hit ?? text, SNIPPET_LENGTH);
};

/**
 * Ranks the index against a query: every token must prefix-match a word in
 * the title, heading or text; weights sum per field hit; a contiguous
 * whole-query match adds its field's weight again. Ties keep index order,
 * so results follow the learning path.
 */
export const rank = (
    query: string,
    entries: SearchEntry[],
    limit = 8
): RankedResult[] => {
    const tokens = tokenize(query);

    if (!tokens.length) {
        return [];
    }

    const phrase = tokens.join(' ');

    return entries
        .map((entry) => ({
            entry,
            score: scoreEntry(entry, tokens, phrase),
            snippet: snippet(entry.text, query)
        }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
};
