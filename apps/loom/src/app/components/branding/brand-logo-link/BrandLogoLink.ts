import { RouteLink, type SimpleComponent } from '@loom-js/core';

import { BrandLogo } from '../logo';

export const BrandLogoLink: SimpleComponent = () =>
    RouteLink({
        children: [BrandLogo({ height: 36, width: 36 }), 'loom'],
        className: 'heading-level-5 u-cross-center u-flex u-gap-8',
        href: '/',
        target: '_self'
    });
