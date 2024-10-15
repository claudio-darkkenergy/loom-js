import { mergeAllowedAttrs } from '../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

interface RawProps {
    role?: string;
}

export type DivProps = Parameters<typeof Div>[0];

export const Div = component<RawProps>(
    (html, { attrs, children, on, role, ...divProps }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            divProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <div $attrs=${attrsOverrides} $on=${on} role=${role}>
                ${children}
            </div>
        `;
    }
);
