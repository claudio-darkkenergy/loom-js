import { MouseEventListener } from '@loom-js/core';

import { Link, LinkProps, Ul } from '@app/component/simple';

export interface LinkGroupProps {
    className?: string;
    linkProps?: LinkProps[];
    onClick?: MouseEventListener;
}

export const LinkGroup = ({ className, linkProps, onClick }: LinkGroupProps) =>
    Ul({
        className,
        listItem: (props: LinkProps) => Link({ ...props, onClick }),
        listProps: linkProps
    });
