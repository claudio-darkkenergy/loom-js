import { type AttrsTemplateTagValue, component } from '@loom-js/core';

import { mergeAllowedAttrs } from '../../../helpers';

export interface LinkProps {
    href: string;
    target?: '_blank' | '_self';
    title?: string;
}

export const Link = component<LinkProps>(
    (
        html,
        { attrs, children, href, on, target = '_self', title, ...linkProps }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            linkProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <a
                $attrs=${attrsOverrides}
                $on=${on}
                href=${href}
                target=${target}
                title=${title}
            >
                ${children}
            </a>
        `;
    }
);
