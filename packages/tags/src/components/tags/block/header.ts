import { mergeAllowedAttrs } from '../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

export type HeaderProps = ComponentProps;

export const Header = component((html, { attrs, children, on, ...props }) => {
    const attrsOverrides = mergeAllowedAttrs(
        attrs,
        props as unknown as AttrsTemplateTagValue
    );
    return html`
        <header $attrs=${attrsOverrides} $on=${on}>${children}</header>
    `;
});
