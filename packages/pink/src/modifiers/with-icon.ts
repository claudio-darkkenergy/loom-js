import type { TemplateTagValue, ComponentProps } from '@loom-js/core';
import { Span } from '@loom-js/tags';

export interface WithIconProps {
    [key: string]: unknown;
    // Appends the icon when provided vs. prepend placement.
    appendIcon?: boolean;
    // The classname for the icon - renders only when provided.
    icon?: string;
    iconClassName?: string;
}

export const withIcon = ({
    appendIcon,
    children,
    icon,
    iconClassName = '',
    ...props
}: ComponentProps<WithIconProps>) => {
    const childrenWithIcon: TemplateTagValue[] = [
        Span({
            attrs: {
                'aria-hidden': true
            },
            className: [icon, iconClassName].join(' ').trim()
        })
    ].concat(children);

    return {
        ...props,
        children:
            children && icon
                ? appendIcon
                    ? childrenWithIcon.reverse()
                    : childrenWithIcon
                : children
    };
};
