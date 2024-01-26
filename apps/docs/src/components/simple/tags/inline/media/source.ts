import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';
import { MediaMimeTypes } from '@app/types';

export interface SourceProps {
    media?: string;
    src?: string;
    srcSet?: string;
    type?: MediaMimeTypes;
}

export const Source = component<SourceProps>(
    (html, { attrs, media, on, src, srcSet, type, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            Object.assign(attrs || {}, { media, srcset: srcSet, type }),
            props as unknown as AttrsTemplateTagValue
        );
        return html` <source $attrs=${attrsOverrides} $on=${on} $src=${src} />`;
    }
);
