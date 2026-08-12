import { activity, type ValueProp } from '@loom-js/core';

import { useMediaQuery } from './use-media-query';

// Tracks which media queries each toggle activity is already wired to, so
// repeated hook calls (one per re-mount) don't stack watchers on the shared
// memoized media-query activity. `WeakMap` avoids pinning toggle activities
// that go out of scope elsewhere.
const wiredQueriesByToggle = new WeakMap<
    ReturnType<typeof activity>,
    Set<string>
>();

/**
 * Custom hook to toggle an activity based on media query matches.
 * Idempotent per (toggle activity, query) pair — repeated calls are no-ops.
 *
 * @param toggleActivity The toggle activity.
 * @param when The media queries to watch.
 */
export const useToggle = (
    toggleActivity: ReturnType<typeof activity>,
    ...when: string[]
) => {
    const queryKey = when.join(' and ');
    const wiredQueries =
        wiredQueriesByToggle.get(toggleActivity) || new Set<string>();

    if (wiredQueries.has(queryKey)) {
        return;
    }

    wiredQueries.add(queryKey);
    wiredQueriesByToggle.set(toggleActivity, wiredQueries);

    const { watch: watchMediaQuery } = useMediaQuery(...when);
    const { update: toggle } = toggleActivity;

    watchMediaQuery(
        ({ value: { matches } }: ValueProp<MediaQueryListEvent>) => {
            toggle(matches);
        }
    );
};
