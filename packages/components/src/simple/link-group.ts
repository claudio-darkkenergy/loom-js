import { MouseEventListener } from '@loom-js/core';

import { Link, LinkProps, Ul } from '@loom-js/components/simple';

export interface LinkGroupProps {
    className?: string;
    linkProps?: LinkProps[];
    onClick?: MouseEventListener;
}

export const LinkGroup = ({ className, linkProps = [], onClick }: LinkGroupProps) =>
    Ul({
        className,
        listItem: (props) => Link({ ...(props as LinkProps), onClick }),
        listProps: linkProps
    });
