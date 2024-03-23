import { appContentActivity } from '@app/activities/app-content';
import { StandardLayout } from '@app/component/container/layout/standard';
import { Header } from '@app/component/container/regions';
import { AppRoutes } from '@app/component/reactive/routes/app-routes';
// import { Main } from '@app/component/simple';
// import { Aside } from '@app/component/simple';
import { Page } from '@app/types';
import { Main } from '@loom-js/components/simple';

export const AppLayout = () => {
    const { effect } = appContentActivity;
    // Need to cache function until `pages` changes or some cache bust value set has change(s).
    const getNavigation = (pages: Page[] = []) =>
        pages.map(({ slug, title }) => ({
            children: title,
            href: `${slug}`
        }));

    return StandardLayout({
        // bodyTop: BodyTop(),
        header: effect(({ value: { site, siteLoaded } }) => {
            if (!siteLoaded) {
                return undefined;
            }

            const {
                icons,
                pagesCollection,
                shortDescription,
                ...appLayoutProps
            } = site;

            return Header({
                ...appLayoutProps,
                icons: icons && [icons],
                navigation: getNavigation(pagesCollection?.items)
            });
        }),
        leftAside: effect(() => undefined),
        // leftAside: effect(({ value: { site = {} } }) => {
        //     const { pagesCollection } = site;
        //     return Aside({
        //         contents: [
        //             Topics({
        //                 slug: 'docs'
        //             })
        //         ]
        //     });
        // }),
        main: effect(({ value: { site, siteLoaded } }) => {
            return siteLoaded && Main({ children: AppRoutes({ site }) });
        })
    });
};
