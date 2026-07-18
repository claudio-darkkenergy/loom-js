import { sideNavToggle } from '../activity/toggles';
import { useToggle } from '@loom-js/utils';

/**
 * Toggles the side navigation activity based on media query matches.
 * @param when The media queries to watch.
 */
export const useSideNavToggle = (...when: string[]) => {
    useToggle(sideNavToggle, ...when);
};
