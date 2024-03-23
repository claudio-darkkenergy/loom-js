import { Img, Picture, PictureProps } from '@app/components/simple';

export type ResponsiveImageProps = PictureProps;

export const ResponsiveImage = ({
    sources,
    ...imgProps
}: ResponsiveImageProps) =>
    sources?.length ? Picture({ ...imgProps, sources }) : Img(imgProps);
