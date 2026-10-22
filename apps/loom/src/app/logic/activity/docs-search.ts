import { activity } from '@loom-js/core';

export interface DocsSearchState {
    /** The current query text. */
    query: string;
    /** The index of the active (keyboard-selected) result. */
    selection: number;
}

/**
 * The palette's input state. A query change resets the selection to the
 * first result; the state outlives a close, so reopening shows the last
 * search.
 */
export const docsSearchState = activity<
    DocsSearchState,
    Partial<DocsSearchState>
>({ query: '', selection: 0 }, ({ input, update, value }) =>
    update({
        query: input.query ?? value.query,
        selection:
            input.query !== undefined && input.query !== value.query
                ? 0
                : (input.selection ?? value.selection)
    })
);
