import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export const Paragraph = component(
    (html, { attrs, children, on, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            props as unknown as AttrsTemplateTagValue
        );
        return html` <p $attrs=${attrsOverrides} $on=${on}>${children}</p> `;
    }
);
