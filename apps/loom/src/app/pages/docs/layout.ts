import { ScreenWidthPx } from '../constants';
import { DocContainer } from './components/DocContainer';
import { DocsLayoutSkeleton } from './components/DocsLayoutSkeleton';
import { DocsSideNav } from './components/DocsSideNav';
import { page } from '@/app/logic/activity/selected-content';
import { sideNavToggle } from '@/app/logic/activity/side-nav-toggle';
import {
    useDefaultTopicRedirect,
    useSelectedPage,
    useSelectedTopic
} from '@/app/logic/hooks';
import { useSideNav } from '@/app/logic/hooks/use-side-nav';
import {
    route,
    routeEffect,
    watchRoute,
    type SimpleComponent
} from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

const DocsLayout: SimpleComponent = ({ children, className, ...props }) => {
    const { effect: pageEffect } = page;
    const { effect: sideNavToggleEffect } = sideNavToggle;

    useSideNav(`(width >= ${ScreenWidthPx.TabletStart}px)`);
    useDefaultTopicRedirect('/docs/get-started');
    // Page data
    useSelectedPage('/docs');
    watchRoute(({ value: routeValue }) =>
        // Topic data
        useSelectedTopic(routeValue.params.topic)
    );

    return Div({
        ...props,
        className: classNames(className, 'u-flex'),
        children: [
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
            DocContainer({ children })
        ]
    });
};

export default DocsLayout;
