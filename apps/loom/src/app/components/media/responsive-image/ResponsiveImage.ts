import { type SimpleComponent } from '@loom-js/core';
import { Img, Picture, type PictureProps } from '@loom-js/tags';

export type ResponsiveImageProps = PictureProps;

export const ResponsiveImage: SimpleComponent<ResponsiveImageProps> = ({
    sources,
    ...imgProps
}) => (sources?.length ? Picture({ ...imgProps, sources }) : Img(imgProps));
