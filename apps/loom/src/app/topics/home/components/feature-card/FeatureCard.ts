import styles from './FeatureCard.module.css';
import { type SimpleComponent } from '@loom-js/core';
import { PinkCard } from '@loom-js/pink';
import { H3, Img, type ImgProps } from '@loom-js/tags';
import classNames from 'classnames';

export type FeatureCardProps = { title?: string; bgImageProps?: ImgProps };

export const FeatureCard: SimpleComponent<FeatureCardProps> = ({
    bgImageProps,
    children,
    className,
    title
}) => {
    return PinkCard({
        className: classNames(styles.featureCard, className),
        children: [
            bgImageProps && Img(bgImageProps),
            H3({
                className: 'heading-level-6',
                children: title
            }),
            children
        ]
    });
};
