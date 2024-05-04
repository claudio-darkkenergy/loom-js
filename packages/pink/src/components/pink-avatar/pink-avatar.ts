import { PinkColor, PinkSize } from '../../types';
import { SimpleComponent } from '@loom-js/core';
import { Div, Img, ImgProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkAvatarProps = ImgProps & {
    color?: PinkColor;
    size?: PinkSize;
};

export const PinkAvatar: SimpleComponent<PinkAvatarProps> = ({
    children,
    className,
    color = PinkColor.Default,
    size = PinkSize.Medium,
    src,
    style,
    ...avatarProps
}) => {
    const avatarClassName = classNames(className, 'avatar', {
        [`is-color-${color}`]: Boolean(color),
        [`is-size-${size}`]: size !== PinkSize.Medium
    });

    // All images must set the `alt` attribute to a string.
    return typeof avatarProps.alt === 'string'
        ? Img({
              ...avatarProps,
              className: avatarClassName,
              src,
              style
          })
        : Div({ ...avatarProps, children, className: avatarClassName });
};
