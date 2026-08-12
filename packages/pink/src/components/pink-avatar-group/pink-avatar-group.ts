import { component, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import { PinkAvatar, type PinkAvatarProps } from '../pink-avatar';

export type PinkAvatarGroupProps = ComponentInputProps<{
    itemProps?: PinkAvatarProps[];
    listItemProps?: ComponentInputProps;
}>;

const AvatarGroupItem = component<ComponentInputProps>(
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

export const PinkAvatarGroup = component<PinkAvatarGroupProps>(
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
            class=${classNames(className, 'avatars-group')}
            id=${id}
            style=${style}
        >
            ${
                children ||
                itemProps?.map((avatarProps) =>
                    AvatarGroupItem({
                        ...listItemProps,
                        children: PinkAvatar(avatarProps),
                        className: classNames(
                            listItemProps?.className,
                            'avatars-group-item'
                        )
                    })
                )
            }
        </ul>
    `
);
