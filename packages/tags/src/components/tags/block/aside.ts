import { mergeAllowedAttrs } from '../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export type AsideProps = {};

export const Aside = component<AsideProps>(
    (html, { attrs, children, on, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            props as unknown as AttrsTemplateTagValue
        );

        return html`
            <aside $attrs=${attrsOverrides} $on=${on}>${children}</aside>
        `;
    }
);
