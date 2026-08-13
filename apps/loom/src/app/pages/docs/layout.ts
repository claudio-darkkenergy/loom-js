import {
    component,
    route,
    routeEffect,
    type Unsubscriber
} from '@loom-js/core';
import classNames from 'classnames';

import { DocContainer } from './components/DocContainer';
import { DocsLayoutSkeleton } from './components/DocsLayoutSkeleton';
import { DocsSideNav } from './components/DocsSideNav';
import styles from './styles.module.css';
import { page } from '@/app/logic/activity/selected-content';
import { sideNavToggle, topicTocToggle } from '@/app/logic/activity/toggles';
import { useDocsLayout } from '@/app/logic/hooks';

const DocsLayout = component(
    (html, { children, className, node, onMounted, onUnmounted }) => {
        const { effect: pageEffect } = page;
        // The side nav keeps the declarative effect boundary — its subtree is
        // cheap to re-render, so the framework idiom wins there. The TOC
        // below uses the imperative watch instead because its boundary would
        // re-render the entire topic content to flip one class (see design
        // D1/D2 of `narrow-docs-effect-boundaries`).
        const { effect: sideNavToggleEffect } = sideNavToggle;

        useDocsLayout();

        // Mount-scoped TOC wiring: lifecycle handlers register once (first
        // render) and re-fire per mount transition, so this slot pairs each
        // mount's watch with its unmount unsubscribe — toggling the TOC flips
        // one class instead of re-rendering the whole container subtree.
        let unsubscribeTocToggle: Unsubscriber | undefined;

        onMounted(() => {
            const layoutRoot = node() as HTMLElement;

            unsubscribeTocToggle = topicTocToggle.watch(
                ({ value: isToggledOpen }) =>
                    layoutRoot
                        .querySelector(`.${styles.docContainer}`)
                        ?.classList.toggle(styles._open, !!isToggledOpen)
            );
        });
        onUnmounted(() => unsubscribeTocToggle?.());

        return html`
            <div class=${classNames(className, 'u-flex')}>
                ${pageEffect(({ value: pageData }) => {
                    if (!pageData) {
                        return DocsLayoutSkeleton();
                    }

                    return routeEffect(({ value: routeValue }) => {
                        const sideNavItems =
                            pageData.contentCollection?.items.map(
                                ({ title, slug }) => ({
                                    children: title,
                                    href: slug,
                                    isSelected:
                                        slug === routeValue.params.topic,
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
                    className: classNames(styles.docContainer, {
                        [styles._open]: topicTocToggle.value()
                    })
                })}
            </div>
        `;
    }
);

export default DocsLayout;
