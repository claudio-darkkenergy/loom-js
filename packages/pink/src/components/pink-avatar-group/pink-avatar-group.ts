import { type SimpleComponent } from '@loom-js/core';
import { Ul, type UlProps } from '@loom-js/tags';
import classNames from 'classnames';

import { PinkAvatar } from '../pink-avatar';

export type PinkAvatarGroupProps = Omit<UlProps, 'item'>;

export const PinkAvatarGroup: SimpleComponent<PinkAvatarGroupProps> = ({
    className,
    itemProps,
    listItemProps,
    ...ulProps
}) =>
    Ul({
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
