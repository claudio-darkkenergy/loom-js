import { appContentActivity } from '@app/activities/app-content';
import { pageContentActivity } from '@app/activities/page-content';
import { getSite } from '@app/helpers/api/content/contentful';
import type { Page, Site } from '@app/types';
import { type ApiProviderResponse } from '@app/types/api';
import {
    component,
    onRoute,
    onRouteUpdate,
    type TemplateTagValue
} from '@loom-js/core';
import {
    PinkAvatar,
    PinkAvatarGroup,
    PinkColor,
    PinkHeader,
    PinkTopNav,
    PinkSize
} from '@loom-js/pink';

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
                                    width: 64
                                }),
                                PinkAvatarGroup({
                                    itemProps: [
                                        {
                                            alt: 'loomjs logo',
                                            color: PinkColor.Orange,
                                            height: 64,
                                            size: PinkSize.Large,
                                            src: '/static/img/loom-logo-64.svg',
                                            width: 64
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
                                            width: 64
                                        },
                                        {
                                            children: '+2',
                                            color: PinkColor.Empty,
                                            height: 64,
                                            size: PinkSize.Large,
                                            width: 64
                                        }
                                    ]
                                }),
                                PinkTopNav({
                                    items: getNavigation(
                                        pagesCollection?.items
                                    ),
                                    onClick: onRoute
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
