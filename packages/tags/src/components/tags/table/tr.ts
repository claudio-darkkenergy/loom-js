import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../helpers/merge-allowed-attrs.js';

export const Tr = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html`
        <tr $attrs=${attrsOverrides} $on=${on}>${children}</tr>
    `;
});
