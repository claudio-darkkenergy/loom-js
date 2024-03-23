import { MouseEventListener } from '@loom-js/core';

import { Link, LinkProps, Ul } from '@app/components/simple';

export interface LinkGroupProps {
    className?: string;
    linkProps?: LinkProps[];
    onClick?: MouseEventListener;
}

export const LinkGroup = ({ className, linkProps, onClick }: LinkGroupProps) =>
    Ul({
        className,
        item: (props: LinkProps) => Link({ ...props, onClick }),
        itemProps: linkProps
    });
