import { useMediaQuery } from './use-media-query';
import { activity, type ValueProp } from '@loom-js/core';

/**
 * Custom hook to toggle an activity based on media query matches.
 *
 * @param toggleActivity The toggle activity.
 * @param when The media queries to watch.
 */
export const useToggle = (
    toggleActivity: ReturnType<typeof activity>,
    ...when: string[]
) => {
    const { watch: watchMediaQuery } = useMediaQuery(...when);
    const { update: toggle } = toggleActivity;

    watchMediaQuery(({ value: { matches } }: ValueProp<MediaQueryList>) => {
        toggle(matches);
    });
};
