import {
    component,
    MouseEventListener,
    onRoute,
    onRouteUpdate
} from '@loom-js/core';

import { siteNavToggleActivity } from '@app/activities/site-nav-toggle';
import { ReactiveSiteNavDrawer } from '@app/component/reactive/site-nav-drawer';
import { LinkProps } from '@app/component/simple';
import { SiteLogo, StyledSiteNav } from '@app/component/styled';
import { AnimatedSiteNavButton } from '@app/component/styled/buttons/animated-site-nav-button';
import { ContentfulAsset } from '@app/types/contentful';

import styles from './styles.scss';

interface HeaderProps {
    icons: ContentfulAsset[];
    logo?: ContentfulAsset;
    navigation: Omit<LinkProps, 'onClick'>[];
    title?: string;
}

export const Header = component<HeaderProps>(
    (html, { navigation, onUnmounted, title }) => {
        const { update: showNav } = siteNavToggleActivity;
        const onMenuItemClick: MouseEventListener = (e) => onRoute(e);
        // Close the site nav on route updates.
        const unsubRouteUpdate = onRouteUpdate(() => showNav(false));

        // Do cleanup.
        onUnmounted(() => unsubRouteUpdate());

        return html`
            <header class=${styles.header}>
                <hgroup>
                    <a $click=${onRoute} href="/">
                        ${SiteLogo({
                            caption: title,
                            className: styles.siteLogo,
                            height: 64,
                            width: 64
                        })}
                    </a>
                    <div class=${styles.toolbar}>
                        ${StyledSiteNav({
                            navigation,
                            onClick: onRoute
                        })}
                        ${AnimatedSiteNavButton()}
                    </div>
                </hgroup>
                ${ReactiveSiteNavDrawer(() => ({
                    navigation,
                    onClick: onMenuItemClick
                }))}
            </header>
        `;
    }
);
