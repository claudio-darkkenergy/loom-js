import styles from './Features.module.css';
import {
    ContentCard,
    type ContentCardProps
} from '@/app/components/cards/content-card';
import { FocalContainer } from '@/app/components/containers/focal-container';
import { type SimpleComponent } from '@loom-js/core';
import { PinkGridBox } from '@loom-js/pink';
import { Ul } from '@loom-js/tags';
import classNames from 'classnames';

export type FeaturesProps = {
    features: ContentCardProps[];
};

export const Features: SimpleComponent<FeaturesProps> = ({
    features,
    ...props
}) =>
    FocalContainer({
        ...props,
        title: 'Features',
        children: Ul({
            className: classNames(
                'u-flex u-flex-wrap u-gap-16 u-main-center u-text-center',
                styles.featured
            ),
            item: ContentCard,
            itemProps: features
        })
    });
