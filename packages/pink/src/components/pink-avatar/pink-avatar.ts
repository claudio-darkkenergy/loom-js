import { SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { Div, Img, ImgProps } from '@app/components/simple';

import { PinkColor, PinkSize } from '../../types';

export type PinkAvatarProps = ImgProps & {
    color?: PinkColor;
    size?: PinkSize;
    withBorder?: boolean;
};

export const PinkAvatar: SimpleComponent<PinkAvatarProps> = ({
    children,
    className,
    color,
    size,
    src,
    style,
    withBorder = true,
    ...avatarProps
}) => {
    const avatarClassName = classNames(className, 'avatar', {
        [`is-color-${color}`]: Boolean(color),
        [`is-size-${size}`]: Boolean(size)
    });

    return children
        ? Div({ ...avatarProps, children, className: avatarClassName })
        : Img({
              ...avatarProps,
              className: avatarClassName,
              src,
              style: [
                  //   withBorder ? {} : { 'border-color': 'transparent' },
                  style
              ]
          });
};
