import { el, simple } from '@loom-js/core';
import classNames from 'classnames';

import { type WithIconProps, withIcon } from '../../modifiers/with-icon';

export interface PinkButtonProps extends WithIconProps {
    // A custom button size - modifies height.
    buttonSize?: string;
    // Applies to the `<button>` root only.
    disabled?: boolean;
    // A custom font-size
    fontSize?: string;
    // Sets the root element: an `<a>` when supplied, a `<button>` when
    // omitted. Root-only props are marked below.
    href?: string;
    // The classname for the icon - renders only when provided. A binding
    // (`activity.bind(...)`) drives the class live on the same node.
    icon?: WithIconProps['icon'];
    // A Pink preset for a larger button size - updates height, horizonal padding, & font-size.
    isBig?: boolean;
    // Updates the button to fit only an icon.
    isOnlyIcon?: boolean;
    // Updates the button color scheme.
    isSecondary?: boolean;
    // Removes any visible background or borders.
    isText?: boolean;
    // A custom horizontal padding
    padding?: string;
    // Applies to the `<a>` root only.
    target?: '_blank' | '_self';
    // Applies to the `<button>` root only.
    title?: string;
    // Applies to the `<button>` root only.
    type?: 'button' | 'reset' | 'submit';
}

export const PinkButton = simple<PinkButtonProps>(
    ({
        attrs,
        buttonSize,
        className,
        disabled,
        fontSize,
        href,
        isBig,
        isOnlyIcon,
        isSecondary,
        isText,
        padding,
        style,
        target,
        title,
        type,
        ...buttonProps
    }) =>
        (href === undefined ? el('button') : el('a'))(
            withIcon({
                ...buttonProps,
                attrs: {
                    ...attrs,
                    ...(href === undefined
                        ? {
                              ...(disabled === undefined ? {} : { disabled }),
                              ...(title === undefined ? {} : { title }),
                              type: type ?? 'button'
                          }
                        : { href, target: target ?? '_self' })
                },
                className: classNames(className, 'button', {
                    'is-big': isBig,
                    'is-only-icon': isOnlyIcon,
                    'is-secondary': isSecondary,
                    'is-text': isText
                }),
                style: [
                    {
                        '--p-button-size': buttonSize,
                        '--p-font-size': fontSize,
                        '--padding-horizontal': padding
                    },
                    style
                ]
            })
        )
);
