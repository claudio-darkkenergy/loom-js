import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { Img, type ImgProps } from './img';
import { Source, type SourceProps } from './source';
import { mergeAllowedAttrs } from '../../../../helpers';

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
                ${sources?.map((srcProps: any) => Source(srcProps))}
                ${Img(imgProps)}
            </picture>
        `;
    }
);
