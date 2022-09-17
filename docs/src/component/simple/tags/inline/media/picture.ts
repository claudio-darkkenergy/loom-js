import { component } from '@loomjs/core';

import { Img, ImgProps, Source, SourceProps } from '@app/component/simple';

export type PictureProps = ImgProps & {
    sources?: SourceProps[];
};

export const Picture = component<PictureProps>(
    (html, { className, sources, ...imgProps }) => html`
        <picture class=${className}>
            ${sources?.map((srcProps) => Source(srcProps))} ${Img(imgProps)}
        </picture>
    `
);
