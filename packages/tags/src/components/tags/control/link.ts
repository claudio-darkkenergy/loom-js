import { mergeAllowedAttrs } from '../../../helpers';
import { type AttrsTemplateTagValue, component } from '@loom-js/core';

export type LinkProps = {
    href?: string;
    target?: '_blank' | '_self';
};

export const Link = component<LinkProps>(
    (
        html,
        {
            attrs,
            children,
            href = '',
            on,
            onClick,
            target = '_self',
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
            >
                ${children}
            </a>
        `;
    }
);
