import { Bootstrap } from '@app/bootstrap';
import {
    type ContextFunction,
    lazyImport,
    onRouteUpdate,
    sanitizeLocation
} from '@loom-js/core';

const LazyCore = () => import('@app/pages/core');
const LazyHome = () => import('@app/pages/index');

const Pages = () => {
    const { effect: pageEffect, update: updatePage } = lazyImport<
        ContextFunction | undefined
    >('page', () => Promise.resolve(undefined));

    onRouteUpdate(({ value: location }) => {
        const { pathname } = sanitizeLocation(location);
        let importer: () => Promise<ContextFunction>;

        switch (true) {
            case pathname === '/core':
                importer = async () => {
                    const { Core } = await LazyCore();
                    return Core();
                };
                break;
            default:
                importer = async () => {
                    const { Index } = await LazyHome();
                    return Index();
                };
        }

        updatePage(importer);
    });

    return pageEffect(({ value: page }) => page as ContextFunction);
};

Bootstrap(Pages);
