import { type SimpleComponent } from '@loom-js/core';
import { PinkAvatar, PinkSize, type PinkAvatarProps } from '@loom-js/pink';

export type BrandLogoProps = PinkAvatarProps;

export const BrandLogo: SimpleComponent<BrandLogoProps> = (props) =>
    PinkAvatar({
        ...props,
        alt: 'Brand logo',
        size: PinkSize.Small,
        src: '/static/svg/loom-logo.svg'
    });
