import { component, type Aria, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import { type WithIconProps, withIcon } from '../../modifiers';

type ToggleButtonItemProps = ComponentInputProps<{
    aria?: Aria;
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'reset' | 'submit';
}>;

type ButtonPropsProp = ComponentInputProps<WithIconProps> &
    ToggleButtonItemProps & {
        isSelected?: boolean;
    };

export interface PinkToggleButtonProps {
    buttonProps?: ButtonPropsProp[];
}

const ToggleButtonItem = component<ToggleButtonItemProps>(
    (
        html,
        {
            aria,
            attrs,
            children,
            className,
            disabled,
            id,
            on,
            onClick,
            style,
            title,
            type
        }
    ) => html`
        <li class="toggle-button-item">
            <button
                $attrs=${attrs}
                $click=${onClick}
                $on=${on}
                aria-label=${aria?.label}
                class=${className}
                disabled=${disabled}
                id=${id}
                style=${style}
                title=${title}
                type=${type ?? 'button'}
            >
                ${children}
            </button>
        </li>
    `
);

export const PinkToggleButton = component<
    ComponentInputProps<PinkToggleButtonProps>
>(
    (html, { attrs, buttonProps, className, id, on, onClick, style }) => html`
        <div
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'toggle-button')}
            id=${id}
            style=${style}
        >
            <ul class="toggle-button-list">
                ${buttonProps?.map(
                    ({ className: buttonClassName, isSelected, ...props }) =>
                        ToggleButtonItem(
                            withIcon({
                                ...props,
                                className: classNames(
                                    buttonClassName,
                                    'toggle-button-element',
                                    {
                                        'is-selected': isSelected
                                    }
                                )
                            })
                        )
                )}
            </ul>
        </div>
    `
);
