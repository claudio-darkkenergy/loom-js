import { useToggle } from '@loom-js/utils';

import { sideNavToggle } from '../activity/toggles';

/**
 * Toggles the side navigation activity based on media query matches.
 * @param when The media queries to watch.
 */
export const useSideNavToggle = (...when: string[]) => {
    useToggle(sideNavToggle, ...when);
};
