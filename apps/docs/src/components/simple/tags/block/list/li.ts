import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export const Li = component((html, { attrs, children, on, ...liProps }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        liProps as unknown as AttrsTemplateTagValue
    );

    return html`<li $attrs=${attrsOverrides} $on=${on}>${children}</li>`;
});
