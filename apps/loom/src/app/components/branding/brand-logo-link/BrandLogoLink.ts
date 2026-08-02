import { route, type SimpleComponent } from '@loom-js/core';
import { Link } from '@loom-js/tags';

import { BrandLogo } from '../logo';

export const BrandLogoLink: SimpleComponent = () =>
    Link({
        children: [BrandLogo({ height: 36, width: 36 }), 'loom'],
        className: 'heading-level-5 u-cross-center u-flex u-gap-8',
        href: '/',
        onClick: route
    });
