import type { ComponentInputProps, SimpleComponent } from '@loom-js/core';
import { Button, type ButtonProps, Div, Ul } from '@loom-js/tags';
import classNames from 'classnames';

import { type WithIconProps, withIcon } from '../../modifiers';

type ButtonPropsProp = ComponentInputProps<ButtonProps & WithIconProps> & {
    isSelected?: boolean;
};

export interface PinkToggleButtonProps {
    buttonProps?: ButtonPropsProp[];
}

export const PinkToggleButton: SimpleComponent<PinkToggleButtonProps> = ({
    buttonProps,
    className,
    ...divProps
}) =>
    Div({
        ...divProps,
        children: Ul({
            className: 'toggle-button-list',
            item: Button,
            itemProps: buttonProps?.map(({ className, isSelected, ...props }) =>
                withIcon({
                    ...props,
                    className: classNames(className, 'toggle-button-element', {
                        'is-selected': isSelected
                    })
                })
            ),
            listItemProps: {
                className: 'toggle-button-item'
            }
        }),
        className: classNames(className, 'toggle-button')
    });
