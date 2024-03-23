import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export const H1 = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html` <h1 $attrs=${attrsOverrides} $on=${on}>${children}</h1> `;
});
