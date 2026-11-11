import { component, el, route, Svg } from '@loom-js/core';
import {
    PinkButton,
    PinkContainer,
    PinkGridHeader,
    PinkTopNav
} from '@loom-js/pink';
import classNames from 'classnames';

import { layoutState } from '../logic/activity/layout-state';
import { sideNavToggle } from '../logic/activity/toggles';
import styles from './styles.module.css';
import { BrandLogoLink } from '@/app/components/branding/brand-logo-link';
import { ReleaseStatus } from '@/app/components/branding/release-status';
import { DocsSearchHost, SearchTrigger } from '@/app/components/search';
import { useDocumentTitle, useSearchShortcut } from '@/app/logic/hooks';

const { effect: layoutStateEffect } = layoutState;
const { update: toggleSideNav } = sideNavToggle;

// The header brand cluster — the side-nav toggle (mobile only), the brand
// logo and the release status. Component-only template, so it renders as a
// rootless fragment: each lands directly in the header's flex row.
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
        <${ReleaseStatus} />
    `
);

const PageLayout = component(
    (html, { children, className, style: theme, ...hooks }) => {
        useSearchShortcut(hooks);
        useDocumentTitle(hooks);

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
                style="background-color: #1c1c21; grid-auto-rows: min-content"
            >
                <div
                    slot="col1"
                    class=${classNames(
                        'grid-header-col-1 u-flex u-gap-8',
                        styles.headerCol1
                    )}
                >
                    ${layoutStateEffect(({ value: { sideNav } }) =>
                        HeaderBrand({ sideNav })
                    )}
                </div>
                <${PinkTopNav}
                    slot="col2"
                    className=${classNames(styles.topNav, 'grid-header-col-2')}
                    items=${[
                        { children: 'Docs', href: '/docs' },
                        { children: 'Benchmarks', href: '/benchmarks' },
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
                    ]}
                    onClick=${route}
                />
                <${SearchTrigger} slot="col3" className="grid-header-col-3" />
            </>
            ${DocsSearchHost()}
            <main>${children}</main>
            <${PinkContainer} is=${el('footer')}>© ${new Date().getFullYear()}</>
        </div>
    `;
    }
);

export default PageLayout;
