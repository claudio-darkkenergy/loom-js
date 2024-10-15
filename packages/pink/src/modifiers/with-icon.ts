import type { ComponentProps, SimpleComponent } from '@loom-js/core';
import { Span, SpanProps } from '@loom-js/tags';
import classNames from 'classnames';

const Icon: SimpleComponent<SpanProps> = ({ attrs, ...iconProps }) =>
    Span({
        ...iconProps,
        attrs: {
            ...attrs,
            'aria-hidden': true
        }
    });

export interface WithIconProps {
    [key: string]: unknown;
    // Appends the icon when provided vs. prepend placement.
    appendIcon?: boolean;
    // The classname for the icon - renders only when provided.
    icon?: string;
    // The classname for the icon element.
    iconProps?: SpanProps;
}

export const withIcon = <T>({
    appendIcon,
    children,
    icon,
    iconProps = {},
    ...props
}: ComponentProps<T & WithIconProps>) => {
    const { className, ...iconPropsRest } = iconProps;
    const resolvedIconProps = {
        ...iconPropsRest,
        className: classNames(className, icon)
    };
    const childrenWithIcon = icon
        ? appendIcon && children
            ? [Icon(resolvedIconProps), children].reverse().flat()
            : children
              ? [Icon(resolvedIconProps), children].flat()
              : Icon(resolvedIconProps)
        : children;

    return {
        ...props,
        children: childrenWithIcon
    } as T;
};
