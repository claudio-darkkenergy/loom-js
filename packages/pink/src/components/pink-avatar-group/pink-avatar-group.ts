import { PinkAvatar, PinkAvatarProps } from '../pink-avatar';
import { type SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkAvatarGroupProps = Omit<UlProps, 'item'> & {
    withBorder?: boolean;
};

export const PinkAvatarGroup: SimpleComponent<PinkAvatarGroupProps> = ({
    className,
    itemProps,
    listItemProps,
    withBorder,
    ...ulProps
}) =>
    Ul({
        ...ulProps,
        className: classNames(className, 'avatars-group', {
            'is-with-border': withBorder
        }),
        item: (avatarProps: PinkAvatarProps) => PinkAvatar({ ...avatarProps }),
        itemProps,
        listItemProps: {
            ...listItemProps,
            className: classNames(
                listItemProps?.className,
                'avatars-group-item'
            )
        }
    });
