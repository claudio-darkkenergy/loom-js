import { type WithIconProps, withIcon } from '../../modifiers';
import { type SimpleComponent } from '@loom-js/core';
import { Button, type ButtonProps } from '@loom-js/tags';
import classNames from 'classnames';

export interface PinkButtonProps extends ButtonProps, WithIconProps {
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
}

export const PinkButton: SimpleComponent<PinkButtonProps> = ({
    buttonSize,
    className,
    fontSize,
    isBig,
    isOnlyIcon,
    isSecondary,
    isText,
    padding,
    style,
    ...buttonProps
}) =>
    Button(
        withIcon({
            ...buttonProps,
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
    );
