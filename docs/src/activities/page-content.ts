import { activity } from '@loomjs/core';

import { getPage } from '@app/helpers/api/content/contentful';
import { Page } from '@app/types';

export interface PageContentActivityProps {
    page: Page;
    pageLoaded: boolean;
}

export const pageContentActivity = activity<PageContentActivityProps, string>(
    {
        page: {},
        pageLoaded: false
    },
    async ({ input, update, value }) => {
        const { data, success } = await getPage(input);

        if (success) {
            update({ page: data, pageLoaded: true });
        } else {
            update(value);
        }

        // Activate pre-rendering.
        if ((window as any).snapshot) {
            (window as any).snapshot();
        }
    }
);
