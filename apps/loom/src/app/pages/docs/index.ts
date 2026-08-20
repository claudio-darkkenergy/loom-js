import { el, type SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import { ScreenWidthPx } from '../constants';
import DocsLayout from './layout';
import styles from './styles.module.css';
import { ContentLoadError } from '@/app/components/content/content-load-error';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';
import { TopicContent } from '@/app/components/content/topic-content.ts';
import { TopicToc } from '@/app/components/content/topic-toc';
import { topic } from '@/app/logic/activity/selected-content';

/**
 * The Docs component is a high-level component which renders documentation pages.
 * Given a topic's data, it renders a topic's table of contents, and content.
 * If no topic data is provided, it renders a skeleton loader.
 */
const Docs: SimpleComponent = (props) => {
    const { effect: topicEffect } = topic;

    return DocsLayout({
        ...props,
        // 2a. Same node
        children: [
            topicEffect(({ value: topicData }) => {
                if (!topicData || 'contentError' in topicData) {
                    // @TODO Option 1: Add a skeleton loader for the topic toc by returning an array of skeletons, or a Div w/ an array of skeletons as `children`.
                    //      Option 2: Update the skeleton loader to accept configured bones to allow for classes to be applied, or create a new bone which "floats" right.
                    //      Option 3: Create a "layout" property that accepts bones as values to any of predefined keyed layouts, like "main", "left", "right", etc.
                    return;
                    // return SkeletonLoader({
                    //     className: 'u-margin-block-start-40',
                    //     bones: [
                    //         Bones.mainHeading,
                    //         Bones.detailsDouble,
                    //         Bones.heading,
                    //         Bones.details,
                    //         Bones.box,
                    //         Bones.headingLong,
                    //         Bones.details,
                    //         Bones.boxTall,
                    //         Bones.detailsSingle
                    //     ]
                    // });
                }

                return el('aside')({
                    className: classNames(
                        styles.topicAside,
                        'u-margin-block-start-24 u-padding-block-16'
                    ),
                    children: TopicToc({
                        className: classNames(
                            styles.topicToc,
                            'u-padding-16 u-border-radius-8'
                        ),
                        json: topicData.description?.json
                    })
                });
            }),
            topicEffect(({ value: topicData }) => {
                if (topicData && 'contentError' in topicData) {
                    return ContentLoadError({
                        className: 'u-margin-block-start-40',
                        message: topicData.contentError
                    });
                }

                if (!topicData) {
                    // @TODO Option 1: Add a skeleton loader for the topic toc by returning an array of skeletons, or a Div w/ an array of skeletons as `children`.
                    //      Option 2: Update the skeleton loader to accept configured bones to allow for classes to be applied, or create a new bone which "floats" right.
                    //      Option 3: Create a "layout" property that accepts bones as values to any of predefined keyed layouts, like "main", "left", "right", etc.
                    return SkeletonLoader({
                        className: 'u-margin-block-start-40',
                        bones: [
                            Bones.mainHeading,
                            Bones.detailsDouble,
                            Bones.heading,
                            Bones.details,
                            Bones.box,
                            Bones.headingLong,
                            Bones.details,
                            Bones.boxTall,
                            Bones.detailsSingle
                        ]
                    });
                }

                return TopicContent({
                    className: 'u-margin-block-start-40',
                    json: topicData.description?.json,
                    title: topicData.title
                });
            })
        ]
    });
};

export default Docs;
