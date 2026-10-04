import { el, type SimpleComponent } from '@loom-js/core';
import classNames from 'classnames';

import styles from './Features.module.css';
import {
    ContentCard,
    type ContentCardProps
} from '@/app/components/cards/content-card';
import { FocalContainer } from '@/app/components/containers/focal-container';

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
        children: el('ul')({
            className: classNames(
                'u-flex u-flex-wrap u-gap-16 u-main-center u-text-center',
                styles.featured
            ),
            children: features.map((cardProps) =>
                el('li')({ children: ContentCard(cardProps) })
            )
        })
    });
