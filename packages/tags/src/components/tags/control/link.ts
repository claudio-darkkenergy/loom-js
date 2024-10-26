import { mergeAllowedAttrs } from '../../../helpers';
import {
    type AttrsTemplateTagValue,
    component,
    type ComponentProps
} from '@loom-js/core';

export type RawLinkProps = {
    href?: string;
    target?: '_blank' | '_self';
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
