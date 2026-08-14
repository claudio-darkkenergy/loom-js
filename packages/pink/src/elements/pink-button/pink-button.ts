import { el, type Aria, simple } from '@loom-js/core';
import classNames from 'classnames';

import { type WithIconProps, withIcon } from '../../modifiers';

export interface PinkButtonProps extends WithIconProps {
    aria?: Aria;
    // A custom button size - modifies height.
    buttonSize?: string;
    // Applies to the `<button>` root only.
    disabled?: boolean;
    // A custom font-size
    fontSize?: string;
    // The root-element contract: with `href` set, the root is an `<a>`
    // (taking `target`, default `_self`); without it, the root is a
    // `<button>` (taking `type`, default `button`, plus `disabled`,
    // `title`, and `aria`). Callers opt into the switch by supplying
    // `href` — query/test against the root accordingly.
    href?: string;
    // The classname for the icon - renders only when provided.
    icon?: string;
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
        aria,
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
                              ...(aria?.label === undefined
                                  ? {}
                                  : { 'aria-label': aria.label }),
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
                // Omitted entirely when empty — a style value that resolves to
                // nothing must not reach the root's style binding.
                style:
                    buttonSize === undefined &&
                    fontSize === undefined &&
                    padding === undefined
                        ? style
                        : [
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
