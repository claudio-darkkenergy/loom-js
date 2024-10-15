import { PinkAvatar } from '../pink-avatar';
import { type SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkAvatarGroupProps = Omit<UlProps, 'item'>;

export const PinkAvatarGroup: SimpleComponent<PinkAvatarGroupProps> = ({
    className,
    itemProps,
    listItemProps,
    ...ulProps
}) => {
    console.log({
        className,
        itemProps,
        listItemProps,
        ...ulProps
    });
    return Ul({
        ...ulProps,
        className: classNames(className, 'avatars-group'),
        item: PinkAvatar,
        itemProps,
        listItemProps: {
            ...listItemProps,
            className: classNames(
                listItemProps?.className,
                'avatars-group-item'
            )
        }
    });
};
