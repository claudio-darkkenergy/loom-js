import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../../helpers';
import { type MediaMimeTypes } from '../../../../types';

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
