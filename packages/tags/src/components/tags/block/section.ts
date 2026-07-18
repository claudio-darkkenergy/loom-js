import { mergeAllowedAttrs } from '../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export interface SectionProps {
    role?: string;
}

export const Section = component<SectionProps>(
    (html, { attrs, children, on, role, ...props }) => {
        const attrsWithRole = {
            ...attrs,
            ...(role ? { role } : {})
        } as AttrsTemplateTagValue;
        const attrsOverrides = mergeAllowedAttrs(
            attrsWithRole,
            props as unknown as AttrsTemplateTagValue
        );
        return html`
            <section $attrs=${attrsOverrides} $on=${on}>${children}</section>
        `;
    }
);
