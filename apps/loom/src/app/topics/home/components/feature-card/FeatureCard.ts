import { el, Picture, type PictureProps, simple } from '@loom-js/core';
import { PinkCard } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './FeatureCard.module.css';

export type FeatureCardProps = { title?: string; bgImageProps?: PictureProps };

// Forwards caller `children` — the functional form keeps arbitrary children
// values (including arrays) off the component-tag region path.
export const FeatureCard = simple<FeatureCardProps>(
    ({ bgImageProps, children, className, title }) => {
        return PinkCard({
            className: classNames(styles.featureCard, className),
            children: [
                bgImageProps &&
                    Picture({
                        ...bgImageProps,
                        // The retired tags Img always emitted these defaults.
                        height: bgImageProps.height ?? 'auto',
                        width: bgImageProps.width ?? 'auto'
                    }),
                el('h3')({
                    className: 'heading-level-6',
                    children: title
                }),
                children
            ]
        });
    }
);
