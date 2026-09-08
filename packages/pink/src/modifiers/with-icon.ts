import {
    type AttrBinding,
    el,
    type ComponentInputProps,
    isAttrBinding,
    simple
} from '@loom-js/core';
import classNames from 'classnames';

const Icon = simple(({ attrs, ...iconProps }) =>
    el('span')({
        ...iconProps,
        attrs: Object.assign(attrs || {}, {
            'aria-hidden': true
        })
    })
);

export interface WithIconProps {
    [key: string]: unknown;
    // Appends the icon when provided vs. prepend placement.
    appendIcon?: boolean;
    // The classname for the icon - renders only when provided. A binding
    // (`activity.bind(...)`) drives the class live on the same node.
    icon?: string | AttrBinding;
    // The classname for the icon element.
    iconProps?: ComponentInputProps;
}

export const withIcon = <T>({
    appendIcon,
    children,
    icon,
    iconProps = {},
    ...props
}: ComponentInputProps<T & WithIconProps>) => {
    const { className, ...iconPropsRest } = iconProps;
    const resolvedIconProps = {
        ...iconPropsRest,
        // A binding owns the whole class value: the templating layer applies
        // it to the `class` slot live, so it must reach the element untouched
        // (typed `string` on the prop; the attr slot accepts bindings at
        // runtime).
        className: isAttrBinding(icon)
            ? (icon as unknown as string)
            : classNames(className, icon)
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
