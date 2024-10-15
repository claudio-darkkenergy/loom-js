import { DocContainer } from './components/DocContainer';
import styles from './styles.module.css';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';
import { page } from '@/app/logic/activity/selected-content';
import {
    useDefaultTopicRedirect,
    useSelectedPage,
    useSelectedTopic
} from '@/app/logic/hooks';
import {
    route,
    routeEffect,
    watchRoute,
    type SimpleComponent
} from '@loom-js/core';
import { PinkSideNav } from '@loom-js/pink';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

const DocsLayout: SimpleComponent = ({ children, className, ...props }) => {
    const { effect: pageEffect } = page;

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
                    return SkeletonLoader({
                        className: classNames(
                            'is-not-mobile u-flex u-padding-block-start-16 u-width-200',
                            styles.docSideNavSkeleton
                        ),
                        style: 'border-inline-end: 0.0625rem solid rgb(44, 44, 48)',
                        bones: [Bones.boxAuto]
                    });
                }

                return routeEffect(({ value: routeValue }) =>
                    PinkSideNav({
                        className: classNames(
                            'is-not-mobile u-width-200',
                            styles.docSideNav
                        ),
                        topLinkProps: [
                            {
                                children: 'Home',
                                href: '/',
                                onClick: route
                            },
                            ...(pageData?.contentCollection?.items.map(
                                ({ title, slug }) => ({
                                    children: title,
                                    href: slug,
                                    isSelected:
                                        slug === routeValue.params.topic,
                                    onClick: route
                                })
                            ) || [])
                        ]
                    })
                );
            }),
            DocContainer({ children })
        ]
    });
};

export default DocsLayout;
