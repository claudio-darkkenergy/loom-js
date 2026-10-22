import { activity, resource } from '@loom-js/core';

import type { SearchEntry } from '../../../../project/client/search-index.mjs';
import { getSearchIndex } from '@/app/logic/providers/search-index';

export interface SearchIndexFailure {
    searchError: string;
}

/** The resource-cache key — namespaced like the other app resources. */
export const SEARCH_INDEX_RESOURCE_KEY = 'docs:search-index';

/**
 * The search index pipeline: `update(null)` loads the index once per window
 * through the keyed resource cache. A failed load commits a failure value
 * and stays out of the cache, so the next open retries.
 */
export const searchIndex = activity<
    SearchEntry[] | SearchIndexFailure | undefined,
    null
>(undefined, async ({ signal, update }) => {
    try {
        const entries = await resource(
            SEARCH_INDEX_RESOURCE_KEY,
            getSearchIndex
        );

        if (!signal.aborted) {
            update(entries);
        }
    } catch (loadError) {
        if (!signal.aborted) {
            update({
                searchError:
                    loadError instanceof Error
                        ? loadError.message
                        : 'The search index request failed.'
            });
        }
    }
});

export const isSearchIndexFailure = (
    value: SearchEntry[] | SearchIndexFailure | undefined
): value is SearchIndexFailure => !!value && 'searchError' in value;
