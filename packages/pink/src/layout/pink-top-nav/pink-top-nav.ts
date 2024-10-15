import type { ComponentProps, SimpleComponent } from '@loom-js/core';
import { Li, Link, type LinkProps, Nav } from '@loom-js/tags';
import classNames from 'classnames';

export interface PinkTopNavProps {
    items?: Omit<ComponentProps<LinkProps>, 'onClick'>[];
}

export const PinkTopNav: SimpleComponent<PinkTopNavProps> = ({
    className,
    items,
    on,
    onClick,
    style,
    ...navProps
}) =>
    Nav({
        ...navProps,
        children: items?.map((link) =>
            Li({
                children: Link({
                    on,
                    onClick,
                    ...link
                })
            })
        ),
        className: classNames('u-cross-center u-flex u-gap-32', className),
        style: ['list-style: none', style].flat()
    });
