import { ReactiveComponent } from '@loomjs/core';

import { siteNavToggleActivity } from '@app/activities/site-nav-toggle';
import {
    StyledDrawerSiteNav,
    StyledDrawerSiteNavProps,
    StyledSiteDrawer
} from '@app/component/styled';

export const ReactiveSiteNavDrawer: ReactiveComponent<
    boolean,
    StyledDrawerSiteNavProps
> = (transform) => {
    const { effect } = siteNavToggleActivity;

    return effect(({ value }) =>
        StyledSiteDrawer({
            body: StyledDrawerSiteNav(transform(value)),
            isActive: value
        })
    );
};
