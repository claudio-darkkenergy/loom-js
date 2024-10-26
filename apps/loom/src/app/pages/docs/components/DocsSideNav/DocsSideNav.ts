import styles from './DocsSideNav.module.css';
import { layoutState } from '@/app/logic/activity/layout-state';
import { component, route } from '@loom-js/core';
import { DropListItemProps, PinkSideNav } from '@loom-js/pink';
import classNames from 'classnames';

type DocsSideNavProps = {
    isOpen?: boolean;
    sideNavItems?: DropListItemProps[];
};

export const DocsSideNav = component<DocsSideNavProps>(
    (html, { isOpen, sideNavItems = [], onMounted, onUnmounted }) => {
        const { update: updateLayoutState } = layoutState;

        onMounted(() => updateLayoutState({ sideNav: true }));
        onUnmounted(() => updateLayoutState({ sideNav: false }));

        return html`
            <aside
                class=${classNames(styles.docsSideNav, {
                    [styles._open]: isOpen
                })}
            >
                ${PinkSideNav({
                    className: classNames(
                        styles.sideNav,
                        'u-border-width-0 u-overflow-y-auto u-position-sticky'
                    ),
                    style: { '--inset-block-start': 0 },
                    topLinkProps: [
                        {
                            children: 'Home',
                            href: '/',
                            onClick: route
                        },
                        ...sideNavItems
                    ]
                })}
            </aside>
        `;
    }
);
