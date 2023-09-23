import { component } from '@loom-js/core';

import { appContentActivity } from '@app/activities/app-content';
import { AppLayout } from '@app/component/reactive/layout/app-layout';
import { getSite } from '@app/helpers/api/content/contentful';
import '@app/styles/base.scss';
import { Site } from '@app/types';
import { ApiProviderResponse } from '@app/types/api';

import styles from './styles.scss';

export const App = component((html, { onCreated }) => {
    const { update } = appContentActivity;

    onCreated(async () => {
        const siteResponse = (await getSite(
            'loom'
        )) as unknown as ApiProviderResponse<Site>;

        siteResponse.data &&
            update({ site: siteResponse.data, siteLoaded: true });
    });

    return html` <div class=${styles.app}>${AppLayout()}</div> `;
});
