import { mergeAllowedAttrs } from '../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

export type FooterProps = ComponentProps;

export const Footer = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html`
        <footer $attrs=${attrsOverrides} $on=${on}>${children}</footer>
    `;
});
