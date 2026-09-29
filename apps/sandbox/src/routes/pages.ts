import { locationEffect } from '@loom-js/core';

import { Bootstrap } from '@app/bootstrap';
import { Core } from '@app/pages/core';
import { EventMonitoring } from '@app/pages/event-monitoring';
import { Index } from '@app/pages/index';
import { Lazyload } from '@app/pages/lazyload';

// Trims the trailing slash so "/core/" matches "/core".
const trimTrailingSlash = (pathname: string) =>
    pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;

const Pages = () =>
    locationEffect(({ value: location }) => {
        const pathname = trimTrailingSlash(location.pathname);

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
