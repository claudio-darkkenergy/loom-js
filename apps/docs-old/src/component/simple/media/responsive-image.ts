import { Img, Picture, PictureProps } from '@app/component/simple';

export type ResponsiveImageProps = PictureProps;

export const ResponsiveImage = ({
    sources,
    ...imgProps
}: ResponsiveImageProps) =>
    sources?.length ? Picture({ ...imgProps, sources }) : Img(imgProps);
