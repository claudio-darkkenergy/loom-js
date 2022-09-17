import { activity } from '@loomjs/core';

import { Site } from '@app/types';

export interface AppContentActivityProps {
    site: Partial<Site>;
    siteLoaded: boolean;
}

export const appContentActivity = activity<AppContentActivityProps>({
    site: {},
    siteLoaded: false
});
