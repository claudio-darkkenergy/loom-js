import { AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export interface DivProps {
    role?: string;
}

export const Div = component<DivProps>(
    (html, { attrs, children, on, role, ...divProps }) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            divProps as unknown as AttrsTemplateTagValue
        );

        return html`<div $attrs=${attrsOverrides} $on=${on} role=${role}>
            ${children}
        </div>`;
    }
);
