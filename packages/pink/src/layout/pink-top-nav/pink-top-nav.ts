import {
    component,
    type ComponentInputProps,
    type OnTemplateTagValue,
    type ReservedProps,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

export interface PinkTopNavItemProps {
    attrs?: ComponentInputProps['attrs'];
    children?: TemplateTagValue | TemplateTagValue[];
    className?: string;
    href?: string;
    onClick?: ReservedProps['onClick'];
    target?: '_blank' | '_self';
}

export interface PinkTopNavProps {
    items?: PinkTopNavItemProps[];
}

type TopNavItemProps = PinkTopNavItemProps & {
    // The nav-level handlers, applied when the item supplies none of its own.
    fallbackClick?: ReservedProps['onClick'];
    sharedOn?: OnTemplateTagValue;
};

const TopNavItem = component<TopNavItemProps>(
    (
        html,
        {
            attrs,
            children,
            className,
            fallbackClick,
            href,
            onClick,
            sharedOn,
            target
        }
    ) => html`
        <li style="display: contents">
            <a
                $attrs=${attrs}
                $click=${onClick ?? fallbackClick}
                $on=${sharedOn}
                class=${className}
                href=${href}
                target=${target ?? '_self'}
            >
                ${children}
            </a>
        </li>
    `
);

export const PinkTopNav = component<ComponentInputProps<PinkTopNavProps>>(
    (html, { className, id, items, on, onClick, style }) => html`
        <nav
            class=${classNames('u-cross-center u-flex u-gap-32', className)}
            id=${id}
            style=${['list-style: none', style]}
        >
            ${items?.map((itemProps) =>
                TopNavItem({
                    ...itemProps,
                    fallbackClick: onClick,
                    sharedOn: on
                })
            )}
        </nav>
    `
);
