import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '@app/helpers/loom-js';

export interface SectionProps {
    role?: string;
}

export const Section = component<SectionProps>(
    (html, { attrs, children, on, role, ...props }) => {
        const attrsOverrides = mergeAllowedAttrs(
            { ...attrs, ...(role ? { role } : {}) },
            props as unknown as AttrsTemplateTagValue
        );
        return html`<section $attrs=${attrsOverrides} $on=${on}>
            ${children}
        </section>`;
    }
);
