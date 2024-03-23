import { component, MouseEventListener } from '@loom-js/core';

export interface LinkProps {
    href: string;
    onClick?: MouseEventListener;
    target?: '_blank' | '_self';
    title?: string;
}

export const Link = component<LinkProps>(
    (
        html,
        { children, className, href, onClick, target = '_self', title }
    ) => html`
        <a
            $click=${onClick}
            class=${className}
            href=${href}
            target=${target}
            title=${title}
        >
            ${children}
        </a>
    `
);
