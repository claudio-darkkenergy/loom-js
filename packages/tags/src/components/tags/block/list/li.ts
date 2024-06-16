import { mergeAllowedAttrs } from '../../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export const Li = component((html, { attrs, children, on, ...liProps }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        liProps as unknown as AttrsTemplateTagValue
    );

    return html`
        <li $attrs=${attrsOverrides} $on=${on}>${children}</li>
    `;
});
