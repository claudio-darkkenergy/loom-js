import { component, MouseEventListener, onRoute } from '@loom-js/core';

import { Link } from '@app/component/simple';

export const HeaderNav = component(
    (html) => html`
        <header>
            <button
                $click="${((e) =>
                    onRoute(e, {
                        href: '/'
                    })) as MouseEventListener}"
            >
                nectar (js)
            </button>
            <nav>
                ${Link({
                    children: 'Home',
                    href: '/',
                    onClick: onRoute
                })}
                |
                ${Link({
                    children: 'Docs',
                    href: '/docs',
                    onClick: onRoute
                })}
            </nav>
        </header>
    `
);
