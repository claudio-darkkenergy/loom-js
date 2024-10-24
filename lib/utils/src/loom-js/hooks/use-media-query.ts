import { activity } from '@loom-js/core';
import { matchQuery } from '@loom-js/utils';

// Starts the media query activity.
export const useMediaQuery = (...queries: string[]) => {
    const mediaQuery = activity<MediaQueryList>({});

    matchQuery(mediaQuery.update, ...queries);
    return mediaQuery;
};
