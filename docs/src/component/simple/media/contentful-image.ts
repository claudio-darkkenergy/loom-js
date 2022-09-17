import { ResponsiveImage, ResponsiveImageProps } from '@app/component/simple';
import { ContentfulAsset } from '@app/types/contentful';

export type ContentfulImageProps = ResponsiveImageProps &
    Partial<ContentfulAsset>;

export const ContentfulImage = ({
    description,
    url,
    ...imgProps
}: ContentfulImageProps) =>
    ResponsiveImage({
        ...imgProps,
        alt: description,
        src: url
    });
