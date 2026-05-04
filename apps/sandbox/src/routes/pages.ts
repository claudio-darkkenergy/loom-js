import { Bootstrap } from '@app/bootstrap';
import { Core } from '@app/pages/core';
import { EventMonitoring } from '@app/pages/event-monitoring';
import { Index } from '@app/pages/index';
import { Lazyload } from '@app/pages/lazyload';
import {
    type ContextFunction,
    lazyImport,
    onRouteUpdate,
    sanitizeLocation,
    router
} from '@loom-js/core';

// const LazyCore = () => import('@app/pages/core');
// const LazyHome = () => import('@app/pages/index');
// const LazyLazyload = () => import('@app/pages/lazyload');
// const LazyEventMonitoring = () => import('@app/pages/event-monitoring');

// const _LazyPages = () => {
//     const { effect: pageEffect, update: updatePage } = lazyImport<
//         ContextFunction | undefined
//     >('page', () => Promise.resolve(undefined));

//     onRouteUpdate(({ value: location }) => {
//         const { pathname } = sanitizeLocation(location);
//         let importer: () => Promise<ContextFunction>;

//         switch (true) {
//             case pathname === '/core':
//                 importer = async () => {
//                     const { Core } = await LazyCore();
//                     return Core();
//                 };
//                 break;
//             case pathname === '/event-monitoring':
//                 importer = async () => {
//                     const { EventMonitoring } = await LazyEventMonitoring();
//                     return EventMonitoring();
//                 };
//                 break;
//             case pathname === '/lazyload':
//                 importer = async () => {
//                     const { Lazyload } = await LazyLazyload();
//                     return Lazyload();
//                 };
//                 break;
//             default:
//                 importer = async () => {
//                     const { Index } = await LazyHome();
//                     return Index();
//                 };
//         }

//         updatePage(importer);
//     });

//     return pageEffect(({ value: page }) => page as ContextFunction);
// };

const Pages = () =>
    router(({ value: location }) => {
        const { pathname } = sanitizeLocation(location);

        switch (true) {
            case pathname === '/core':
                return Core();
            case pathname === '/lazyload':
                return Lazyload();
            case pathname === '/event-monitoring':
                return EventMonitoring();
            default:
                return Index();
        }
    });

Bootstrap(Pages);
