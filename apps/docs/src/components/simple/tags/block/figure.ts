import {
    AttrsTemplateTagValue,
    component,
    TemplateTagValue
} from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export interface FigureProps {
    caption?: TemplateTagValue;
}

export const Figure = component<FigureProps>(
    (html, { attrs, caption, children, on, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            props as unknown as AttrsTemplateTagValue
        );
        return html`
            <figure $attrs=${attrsOverrides} $on=${on}>
                ${children}
                <figcaption>${caption}</figcaption>
            </figure>
        `;
    }
);
