import { PinkAvatar, PinkAvatarProps } from '../pink-avatar';
import { type SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkAvatarGroupProps = Omit<UlProps, 'item'> & {
    with3Char?: boolean;
    withBorder?: boolean;
};

export const PinkAvatarGroup: SimpleComponent<PinkAvatarGroupProps> = ({
    className,
    itemProps,
    listItemProps,
    with3Char,
    withBorder,
    ...ulProps
}) =>
    Ul({
        ...ulProps,
        className: classNames(className, 'avatars-group', {
            'is-with-3-char': with3Char,
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
