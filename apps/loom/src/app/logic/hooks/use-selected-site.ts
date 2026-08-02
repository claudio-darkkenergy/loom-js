import { redirect, watchRoute } from '@loom-js/core';

import { site } from '../activity/selected-content';
import { getSite } from '@/app/logic/providers/contentful';

export const useSelectedSite = () => {
    const { update, effect } = site;

    watchRoute(async ({ value: routeValue }) => {
        if (!routeValue.params.topic) {
            redirect('/docs/get-started');
            return;
        }

        if (!routeValue.pathname) {
            return;
        }

        const { data, error, status } = await getSite('loom');
        console.log(routeValue.pathname, { data, error, status });

        update(data);
    });

    return { selectedDocEffect: effect };
};
