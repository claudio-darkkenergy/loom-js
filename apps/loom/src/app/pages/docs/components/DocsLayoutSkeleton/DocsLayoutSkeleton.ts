import classNames from 'classnames';

import styles from './DocsLayoutSkeleton.module.css';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';

export const DocsLayoutSkeleton = () =>
    SkeletonLoader({
        className: classNames(
            'is-not-mobile u-flex u-padding-block-start-16',
            styles.docsSideNavSkeleton
        ),
        style: 'border-inline-end: 0.0625rem solid rgb(44, 44, 48)',
        bones: [Bones.boxAuto]
    });
