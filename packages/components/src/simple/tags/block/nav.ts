import { component, MouseEventListener } from '@loom-js/core';

import { Link, LinkProps } from '@loom-js/components/simple';

export interface NavProps {
    navigation: Omit<LinkProps, 'onClick'>[];
    onClick?: MouseEventListener;
}

export const Nav = component<NavProps>(
    (html, { className, navigation, onClick }) => html`
        <nav class="${className}">
            ${navigation?.map((link) =>
                Link({
                    ...link,
                    onClick
                })
            )}
        </nav>
    `
);
