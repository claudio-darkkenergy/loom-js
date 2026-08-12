import { activity } from '@loom-js/core';
import { matchQuery } from '@loom-js/utils';

type MediaQueryActivity = ReturnType<typeof activity<MediaQueryListEvent>>;

// One activity + one `matchMedia` listener per distinct query for the app
// lifetime — loom has no reactive teardown, so per-call registration would
// leak a listener on every re-mount.
const mediaQueryActivities = new Map<string, MediaQueryActivity>();

// Starts the media query activity, or returns the memoized activity when one
// already exists for the normalized query.
export const useMediaQuery = (...queries: string[]) => {
    // Normalized the same way `matchQuery` joins its queries.
    const queryKey = queries.join(' and ');
    const memoizedMediaQuery = mediaQueryActivities.get(queryKey);

    if (memoizedMediaQuery) {
        return memoizedMediaQuery;
    }

    // `matchQuery` synthesizes `{ matches, media }` event objects for both the
    // initial call and every change, so the event shape is the activity's
    // true value type; the empty initial value is replaced immediately below.
    const mediaQuery = activity<MediaQueryListEvent>({} as MediaQueryListEvent);

    mediaQueryActivities.set(queryKey, mediaQuery);
    matchQuery(mediaQuery.update, ...queries);

    return mediaQuery;
};
