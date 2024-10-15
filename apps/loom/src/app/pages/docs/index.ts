import DocsLayout from './layout';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';
import { TopicContent } from '@/app/components/content/topic-content.ts';
import { topic } from '@/app/logic/activity/selected-content';
import { type SimpleComponent } from '@loom-js/core';

const Docs: SimpleComponent = (props) => {
    const { effect: topicEffect } = topic;

    return DocsLayout({
        ...props,
        children: topicEffect(({ value: topicData }) => {
            console.log({ topicData });
            if (!topicData) {
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
    });
};

export default Docs;
