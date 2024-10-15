import { mergeAllowedAttrs } from '../../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export interface ImgProps {
    alt?: string;
    height?: number | string;
    src?: string;
    width?: number | string;
}

export const Img = component<ImgProps>(
    (
        html,
        { alt, attrs, height = 'auto', on, src, width = 'auto', ...props }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            Object.assign(attrs || {}, { alt, height, width }),
            props as unknown as AttrsTemplateTagValue
        );
        return html`
            <img $attrs=${attrsOverrides} $on=${on} src=${src} />
        `;
    }
);
