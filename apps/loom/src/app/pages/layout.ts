import { layoutState } from '../logic/activity/layout-state';
import { sideNavToggle } from '../logic/activity/side-nav-toggle';
import styles from './styles.module.css';
import { BrandLogoLink } from '@/app/components/branding/brand-logo-link';
import { component, route } from '@loom-js/core';
import {
    PinkButton,
    PinkContainer,
    PinkGridHeader,
    PinkTopNav
} from '@loom-js/pink';
import { Div, Footer } from '@loom-js/tags';
import { useMediaQuery } from '@loom-js/utils';
import classNames from 'classnames';

const PageLayout = component((html, { children, className, style: theme }) => {
    const { effect: layoutStateEffect } = layoutState;
    const { update: toggleSideNav } = sideNavToggle;

    return html`
        <div
            id="layout"
            class=${classNames('body-text-1', className)}
            style=${[theme, 'height: 100%']}
        >
            ${PinkGridHeader({
                className: classNames(
                    styles.header,
                    'body-text-1 u-padding-16'
                ),
                gridCol1: {
                    is: () =>
                        Div({
                            className: classNames(
                                'u-flex u-gap-8',
                                styles.headerCol1
                            ),
                            children: layoutStateEffect(
                                ({ value: { sideNav } }) => [
                                    PinkButton({
                                        className: classNames(
                                            'is-only-mobile',
                                            {
                                                'u-hide': !sideNav
                                            }
                                        ),
                                        icon: 'icon-menu',
                                        isOnlyIcon: true,
                                        isText: true,
                                        onClick: () => toggleSideNav(null)
                                    }),
                                    BrandLogoLink({})
                                ]
                            )
                        })
                },
                gridCol2: {
                    is: PinkTopNav,
                    className: styles.topNav,
                    items: [{ children: 'Docs', href: '/docs', onClick: route }]
                },
                style: 'background-color: #1c1c21; grid-auto-rows: min-content'
            })}
            <main>${children}</main>
            ${PinkContainer({
                is: Footer,
                children: '© 2024'
            })}
        </div>
    `;
});

export default PageLayout;
