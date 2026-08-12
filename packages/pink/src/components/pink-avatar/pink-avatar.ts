import {
    el,
    type ComponentInputProps,
    type SimpleComponent
} from '@loom-js/core';
import classNames from 'classnames';

import { PinkColor, PinkSize } from '../../types';

export type PinkAvatarProps = ComponentInputProps<{
    alt?: string;
    color?: PinkColor;
    height?: number | string;
    isWith3Char?: boolean;
    size?: PinkSize;
    src?: string;
    width?: number | string;
}>;

// Branching root — `img` for image avatars, `div` for character avatars —
// with no markup of its own, so the functional form stays.
export const PinkAvatar: SimpleComponent<PinkAvatarProps> = ({
    alt,
    attrs,
    children,
    className,
    color = PinkColor.Default,
    height = 'auto',
    isWith3Char,
    size = PinkSize.Medium,
    src,
    width = 'auto',
    ...avatarProps
}) => {
    const avatarClassName = classNames(className, 'avatar', {
        [`is-color-${color}`]: Boolean(color),
        [`is-size-${size}`]: size !== PinkSize.Medium,
        'is-with-3-char': isWith3Char
    });

    // All images must set the `alt` attribute to a string.
    return typeof alt === 'string'
        ? el('img')({
              ...avatarProps,
              attrs: {
                  ...attrs,
                  alt,
                  height,
                  ...(src === undefined ? {} : { src }),
                  width
              },
              className: avatarClassName
          })
        : el('div')({
              ...avatarProps,
              attrs,
              children,
              className: avatarClassName
          });
};
