import { sideNavToggle } from '../activity/side-nav-toggle';
import { type ValueProp } from '@loom-js/core';
import { useMediaQuery } from '@loom-js/utils';

export const useSideNav = (when: string) => {
    const { watch: watchMediaQuery } = useMediaQuery(when);
    const { update: toggleSideNav } = sideNavToggle;

    watchMediaQuery(({ value: { matches } }: ValueProp<MediaQueryList>) => {
        toggleSideNav(matches);
    });
};
