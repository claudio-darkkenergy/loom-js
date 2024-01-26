import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { Img, ImgProps, Source, SourceProps } from '@app/components/simple';
import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export type PictureProps = ImgProps & {
    sources?: SourceProps[];
};

export const Picture = component<PictureProps>(
    (html, { attrs, on, sources, ...imgProps }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            imgProps as unknown as AttrsTemplateTagValue
        );
        return html`
            <picture $attrs=${attrsOverrides} $on=${on}>
                ${sources?.map((srcProps) => Source(srcProps))} ${Img(imgProps)}
            </picture>
        `;
    }
);
