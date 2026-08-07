import { component, route } from '@loom-js/core';
import {
    PinkButton,
    PinkContainer,
    PinkGridHeader,
    PinkTopNav
} from '@loom-js/pink';
import { Div, Footer, Svg } from '@loom-js/tags';
import classNames from 'classnames';

import { layoutState } from '../logic/activity/layout-state';
import { sideNavToggle } from '../logic/activity/toggles';
import styles from './styles.module.css';
import { BrandLogoLink } from '@/app/components/branding/brand-logo-link';

const { effect: layoutStateEffect } = layoutState;
const { update: toggleSideNav } = sideNavToggle;

// The header brand cluster — the side-nav toggle (mobile only) next to the
// brand logo. Component-only template, so it renders as a rootless fragment:
// both elements land directly in the flex row, exactly like the array of
// calls this replaces.
const HeaderBrand = component<{ sideNav?: boolean }>(
    (html, { sideNav }) => html`
        <${PinkButton}
            className=${classNames('is-only-mobile', { 'u-hide': !sideNav })}
            icon="icon-menu"
            isOnlyIcon
            isText
            onClick=${() => toggleSideNav(null)}
        />
        <${BrandLogoLink} />
    `
);

const PageLayout = component((html, { children, className, style: theme }) => {
    return html`
        <div
            id="layout"
            class=${classNames('body-text-1', className)}
            style=${[theme, 'height: 100%']}
        >
            <${PinkGridHeader}
                className=${classNames(
                    styles.header,
                    'body-text-1 u-padding-16'
                )}
                gridCol1=${{
                    is: () =>
                        Div({
                            className: classNames(
                                'u-flex u-gap-8',
                                styles.headerCol1
                            ),
                            children: layoutStateEffect(
                                ({ value: { sideNav } }) =>
                                    HeaderBrand({ sideNav })
                            )
                        })
                }}
                gridCol2=${{
                    is: PinkTopNav,
                    className: styles.topNav,
                    items: [
                        { children: 'Docs', href: '/docs' },
                        {
                            className: classNames(
                                styles.socialLink,
                                'u-color-text-gray'
                            ),
                            children: Svg({
                                path: '/static/svg/social-sprite.svg',
                                size: '20',
                                svgId: 'logo-github'
                            }),
                            href: 'https://github.com/claudio-darkkenergy/loom-js/tree/main/packages/core',
                            onClick: () => {},
                            target: '_blank'
                        }
                    ],
                    onClick: route
                }}
                style="background-color: #1c1c21; grid-auto-rows: min-content"
            />
            <main>${children}</main>
            <${PinkContainer} is=${Footer}>© 2024</>
        </div>
    `;
});

export default PageLayout;
