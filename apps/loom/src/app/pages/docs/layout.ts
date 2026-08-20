import { component, route, routeEffect } from '@loom-js/core';
import classNames from 'classnames';

import { DocContainer } from './components/DocContainer';
import { DocsLayoutSkeleton } from './components/DocsLayoutSkeleton';
import { DocsSideNav } from './components/DocsSideNav';
import styles from './styles.module.css';
import { page } from '@/app/logic/activity/selected-content';
import { sideNavToggle, topicTocToggle } from '@/app/logic/activity/toggles';
import { useDocsLayout } from '@/app/logic/hooks';

const DocsLayout = component((html, { children, className }) => {
    const { effect: pageEffect } = page;
    // The side nav keeps the declarative effect boundary — its subtree is
    // cheap to re-render. The TOC open state is a reactive attr binding on
    // the layout root: toggling updates one class attribute, with no
    // re-render of the container subtree (the CSS module targets
    // `._open .docContainer`).
    const { effect: sideNavToggleEffect } = sideNavToggle;

    useDocsLayout();

    return html`
        <div
            class=${topicTocToggle.bind((isToggledOpen) =>
                classNames(className, 'u-flex', {
                    [styles._open]: isToggledOpen
                })
            )}
        >
            ${pageEffect(({ value: pageData }) => {
                if (!pageData) {
                    return DocsLayoutSkeleton();
                }

                if ('contentError' in pageData) {
                    // No side nav when the content load failed — the main
                    // column carries the error state.
                    return;
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
            })}
            ${DocContainer({
                children,
                className: styles.docContainer
            })}
        </div>
    `;
});

export default DocsLayout;
