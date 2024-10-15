import { mergeAllowedAttrs } from '../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

export type RawLinkProps = {
    href?: string;
    target?: '_blank' | '_self';
    title?: string;
};

export type LinkProps = ComponentProps<RawLinkProps>;

export const Link = component<RawLinkProps>(
    (
        html,
        {
            attrs,
            children,
            href = '',
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
