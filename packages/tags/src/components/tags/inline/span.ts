import { mergeAllowedAttrs } from '../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

export type SpanProps = ComponentProps;

export const Span = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html`
        <span $attrs=${attrsOverrides} $on=${on}>${children}</span>
    `;
});
