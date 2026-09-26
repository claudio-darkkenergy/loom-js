import { component, el, route, type ComponentInputProps } from '@loom-js/core';
import { DropListItemProps, PinkSideNav } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './DocsSideNav.module.css';
import { type NavGroupProps } from '@/app/components/navigation/nav-group';
import { NavGroupList } from '@/app/components/navigation/nav-group-list';
import { layoutState } from '@/app/logic/activity/layout-state';

type DocsSideNavProps = {
    isOpen?: boolean;
    sideNavSections?: NavGroupProps[];
};

export const DocsSideNav = component<DocsSideNavProps>(
    (html, { isOpen, sideNavSections = [], onMounted, onUnmounted }) => {
        const { update: updateLayoutState } = layoutState;

        onMounted(() => updateLayoutState({ sideNav: true }));
        onUnmounted(() => updateLayoutState({ sideNav: false }));

        const homeLinkProps: ComponentInputProps<DropListItemProps> = {
            children: 'Home',
            href: '/',
            onClick: route
        };
        // An all-untitled listing renders as the single flat list it always
        // was; any titled section switches to collapsible group sections.
        const isGrouped = sideNavSections.some(({ title }) => !!title);

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
                    ...(isGrouped
                        ? {
                              top: el('section')({
                                  children: NavGroupList({
                                      sections: [
                                          { itemProps: [homeLinkProps] },
                                          ...sideNavSections
                                      ]
                                  })
                              })
                          }
                        : {
                              topLinkProps: [
                                  homeLinkProps,
                                  ...sideNavSections.flatMap(
                                      ({ itemProps = [] }) => itemProps
                                  )
                              ]
                          })
                })}
            </aside>
        `;
    }
);
