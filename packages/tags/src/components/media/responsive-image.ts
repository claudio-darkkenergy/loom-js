import { Img, Picture, type PictureProps } from '../tags';

export type ResponsiveImageProps = PictureProps;

export const ResponsiveImage = ({
    sources,
    ...imgProps
}: ResponsiveImageProps) =>
    sources?.length ? Picture({ ...imgProps, sources }) : Img(imgProps);
