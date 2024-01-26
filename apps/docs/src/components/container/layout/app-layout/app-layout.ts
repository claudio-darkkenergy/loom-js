import { component, onRouteUpdate, type TemplateTagValue } from '@loom-js/core';

import { appContentActivity } from '@app/activities/app-content';
import { pageContentActivity } from '@app/activities/page-content';
import {
    PinkAvatar,
    PinkColor,
    PinkHeader,
    PinkNav,
    PinkSize
} from '@loom-js/pink';
import { PinkAvatarGroup } from '@loom-js/pink/components/pink-avatar-group';
import { getSite } from '@app/helpers/api/content/contentful';
import type { Page, Site } from '@app/types';
import { type ApiProviderResponse } from '@app/types/api';

export interface AppLayoutProps {
    mainContent(contentProps: {
        page: Page;
        site: Partial<Site>;
    }): TemplateTagValue;
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
                        PinkHeader({
                            children: [
                                PinkAvatar({
                                    alt: 'loomjs logo',
                                    color: PinkColor.Empty,
                                    height: 64,
                                    size: PinkSize.XLarge,
                                    src: '/static/img/loom-logo-64.svg',
                                    style: 'padding: 1.25rem 0',
                                    width: 64,
                                    withBorder: false
                                }),
                                PinkAvatarGroup({
                                    itemProps: [
                                        {
                                            alt: 'loomjs logo',
                                            color: PinkColor.Orange,
                                            height: 64,
                                            size: PinkSize.Large,
                                            src: '/static/img/loom-logo-64.svg',
                                            width: 64,
                                            withBorder: false
                                        },
                                        {
                                            alt: 'loomjs logo',
                                            color: PinkColor.Pink,
                                            height: 64,
                                            size: PinkSize.Large,
                                            src: '/static/img/loom-logo-64.svg',
                                            width: 64
                                        },
                                        {
                                            alt: 'loomjs logo',
                                            color: PinkColor.Blue,
                                            height: 64,
                                            size: PinkSize.Large,
                                            src: '/static/img/loom-logo-64.svg',
                                            width: 64,
                                            withBorder: false
                                        },
                                        {
                                            children: '+2',
                                            color: PinkColor.Empty,
                                            height: 64,
                                            size: PinkSize.Large,
                                            width: 64
                                        }
                                    ],
                                    withBorder: false
                                }),
                                PinkNav({
                                    items: getNavigation(pagesCollection?.items)
                                })
                            ]
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
