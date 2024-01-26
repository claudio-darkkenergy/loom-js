import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Li, Link, LinkProps, Nav } from '@app/components/simple';

export interface PinkNavProps {
    items?: Omit<LinkProps, 'onClick'>[];
}

export const PinkNav: SimpleComponent<PinkNavProps> = ({
    className,
    items,
    onClick
}) =>
    Nav({
        children: items?.map((link) =>
            Li({
                children: Link({
                    ...link,
                    onClick
                })
            })
        ),
        className: classNames(className, 'u-cross-center u-flex u-gap-32')
    });
