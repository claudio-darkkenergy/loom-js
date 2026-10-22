import type { SearchEntry } from '../../../../project/client/search-index.mjs';

/** Where the loom build writes the docs search index (`prerender.after`). */
export const SEARCH_INDEX_URL = '/static/search/index.json';

/** The index, fetched — the palette never renders at build time, so no seed. */
export const getSearchIndex = async (): Promise<SearchEntry[]> => {
    const response = await fetch(SEARCH_INDEX_URL);

    if (!response.ok) {
        throw new Error(
            `The search index request failed (${response.status}).`
        );
    }

    const index: unknown = await response.json();

    if (!Array.isArray(index)) {
        throw new Error('The search index is not a list of entries.');
    }

    return index as SearchEntry[];
};
