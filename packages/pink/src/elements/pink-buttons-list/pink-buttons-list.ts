import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import { PinkButton, type PinkButtonProps } from '../pink-button';

export interface PinkButtonsListProps {
    itemProps?: ComponentInputProps<PinkButtonProps>[];
    listItemProps?: ComponentInputProps;
}

const ButtonsListItem = component<ComponentInputProps>(
    (html, { attrs, children, className, id, on, onClick, style }) => html`
        <li
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${className}
            id=${id}
            style=${style}
        >
            ${children}
        </li>
    `
);

export const PinkButtonsList = component<
    ComponentInputProps<PinkButtonsListProps>
>(
    (
        html,
        {
            attrs,
            children,
            className,
            id,
            itemProps,
            listItemProps,
            on,
            onClick,
            style
        }
    ) => html`
        <ul
            $attrs=${attrs}
            $click=${onClick}
            $on=${on}
            class=${classNames(className, 'buttons-list')}
            id=${id}
            style=${style}
        >
            ${
                children ||
                itemProps?.map((buttonProps) =>
                    ButtonsListItem({
                        ...listItemProps,
                        children: PinkButton(buttonProps),
                        className: classNames(
                            listItemProps?.className,
                            'buttons-list-item'
                        )
                    })
                )
            }
        </ul>
    `
);
