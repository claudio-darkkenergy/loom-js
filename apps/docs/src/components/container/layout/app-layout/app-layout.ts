import { appContentActivity } from '@app/activities/app-content';
import { pageContentActivity } from '@app/activities/page-content';
import { getSite } from '@app/helpers/api/content/contentful';
import { MainContentProps } from '@app/pages/types';
import type { Page, Site } from '@app/types';
import { type ApiProviderResponse } from '@app/types/api';
import {
    type AnyComponent,
    component,
    onRoute,
    onRouteUpdate
} from '@loom-js/core';
import {
    PinkAvatar,
    PinkGridHeader,
    PinkTopNav,
    PinkSize
} from '@loom-js/pink';

export interface AppLayoutProps {
    mainContent: AnyComponent<MainContentProps>;
}

export const AppLayout = component<AppLayoutProps>(
    (html, { mainContent, onCreated, style }) => {
        const { effect: appContentEffect, update } = appContentActivity;
        const {
            effect: pageContentEffect,
            reset: resetPageContent,
            update: updatePageContent
        } = pageContentActivity;
        // Need to cache function until `pages` changes or some cache bust value set has change(s).
        const getNavigation = (pages?: Page[]) =>
            pages?.map(({ slug, title }) => ({
                children: title,
                href: `${slug}`
            }));
        const fetchPageContent = (pathname: string) => {
            resetPageContent();
            updatePageContent(pathname);
        };

        onRouteUpdate(({ value: { pathname } }) => fetchPageContent(pathname));
        onCreated(async () => {
            const siteResponse = (await getSite(
                'loom'
            )) as unknown as ApiProviderResponse<Site>;
            console.log({ siteResponse });
            update({ site: siteResponse.data, siteLoaded: true });
        });

        return html`
            <div $style=${style}>
                ${appContentEffect(({ value: { site, siteLoaded } }) => {
                    if (!siteLoaded || !site) {
                        return;
                    }

                    const { pagesCollection } = site;

                    return [
                        PinkGridHeader({
                            gridCol1: {
                                is: PinkAvatar,
                                alt: 'loomjs logo',
                                height: 64,
                                size: PinkSize.XLarge,
                                src: '/static/img/loom-logo-64.svg',
                                style: 'margin: 1.25rem 0',
                                width: 64
                            },
                            gridCol2: {
                                is: PinkTopNav,
                                items: getNavigation(pagesCollection?.items),
                                onClick: onRoute
                            }
                        }),
                        pageContentEffect(
                            ({ value: { page, pageLoaded } }) =>
                                pageLoaded && mainContent({ page, site })
                        )
                    ];
                })}
            </div>
        `;
    }
);
