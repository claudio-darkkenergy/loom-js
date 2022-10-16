import { activity } from '@loom-js/core';

import { Site } from '@app/types';

export interface AppContentActivityProps {
    site: Partial<Site>;
    siteLoaded: boolean;
}

export const appContentActivity = activity<AppContentActivityProps>({
    site: {},
    siteLoaded: false
});
