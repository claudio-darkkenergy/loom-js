import { route, routeEffect, type SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

import { DocContainer } from './components/DocContainer';
import { DocsLayoutSkeleton } from './components/DocsLayoutSkeleton';
import { DocsSideNav } from './components/DocsSideNav';
import styles from './styles.module.css';
import { page } from '@/app/logic/activity/selected-content';
import { sideNavToggle, topicTocToggle } from '@/app/logic/activity/toggles';
import { useDocsLayout } from '@/app/logic/hooks';

const DocsLayout: SimpleComponent = ({ children, className, ...props }) => {
    const { effect: pageEffect } = page;
    const { effect: sideNavToggleEffect } = sideNavToggle;
    const { effect: topicTocToggleEffect } = topicTocToggle;

    useDocsLayout();

    return Div({
        ...props,
        className: classNames(className, 'u-flex'),
        children: [
            // Sidebar
            pageEffect(({ value: pageData }) => {
                if (!pageData) {
                    return DocsLayoutSkeleton();
                }

                return routeEffect(({ value: routeValue }) => {
                    const sideNavItems = pageData.contentCollection?.items.map(
                        ({ title, slug }) => ({
                            children: title,
                            href: slug,
                            isSelected: slug === routeValue.params.topic,
                            onClick: route
                        })
                    );

                    return sideNavToggleEffect(({ value: isToggledOpen }) =>
                        DocsSideNav({
                            isOpen: isToggledOpen,
                            sideNavItems
                        })
                    );
                });
            }),
            topicTocToggleEffect(({ value: isToggledOpen }) =>
                // 1. Updates
                {
                    // 1. Updates
                    const ctxFn = DocContainer({
                        children,
                        className: classNames(styles.docContainer, {
                            [styles._open]: isToggledOpen
                        })
                    });

                    return ctxFn;
                }
            )
        ]
    });
};

export default DocsLayout;
