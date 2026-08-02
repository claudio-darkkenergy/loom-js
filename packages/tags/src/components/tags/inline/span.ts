import {
    type AttrsTemplateTagValue,
    component,
    type ComponentInputProps
} from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../helpers';

export type SpanProps = ComponentInputProps;

export const Span = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html`
        <span $attrs=${attrsOverrides} $on=${on}>${children}</span>
    `;
});
