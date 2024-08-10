import { mergeAllowedAttrs } from '../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export interface LinkProps {
    href: string;
    target?: '_blank' | '_self';
    title?: string;
}

export const Link = component<LinkProps>(
    (
        html,
        {
            attrs,
            children,
            href,
            on,
            onClick,
            target = '_self',
            title,
            ...linkProps
        }
    ) => {
        const attrsOverrides = mergeAllowedAttrs(
            attrs,
            linkProps as unknown as AttrsTemplateTagValue
        );

        return html`
            <a
                $attrs=${attrsOverrides}
                $on=${on}
                $click=${onClick}
                href=${href}
                target=${target}
                title=${title}
            >
                ${children}
            </a>
        `;
    }
);
