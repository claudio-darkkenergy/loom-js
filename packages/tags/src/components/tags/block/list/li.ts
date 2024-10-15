import { mergeAllowedAttrs } from '../../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type GetProps
} from '@loom-js/core';

export type LiProps = GetProps<typeof Li>;

export const Li = component((html, { attrs, children, on, ...liProps }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        liProps as unknown as AttrsTemplateTagValue
    );

    return html`
        <li $attrs=${attrsOverrides} $on=${on}>${children}</li>
    `;
});
