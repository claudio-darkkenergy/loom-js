import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Button, ButtonProps, Span } from '@app/components/simple';

export type PinkButtonProps = ButtonProps & {
    // A custom button size - modifies height.
    buttonSize?: string;
    // A custom font-size
    fontSize?: string;
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
};

export const PinkButton: SimpleComponent<PinkButtonProps> = ({
    buttonSize,
    children,
    fontSize,
    icon,
    isBig,
    isOnlyIcon,
    isSecondary,
    isText,
    padding,
    style,
    ...buttonProps
}) =>
    Button({
        ...buttonProps,
        children: icon
            ? [
                  Span({
                      attrs: {
                          'aria-hidden': true
                      },
                      className: icon
                  }),
                  children
              ]
            : children,
        className: classNames('button', {
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
    });
