import styles from './DocsLayoutSkeleton.module.css';
import {
    Bones,
    SkeletonLoader
} from '@/app/components/content/skeleton-loader';
import classNames from 'classnames';

export const DocsLayoutSkeleton = () =>
    SkeletonLoader({
        className: classNames(
            'is-not-mobile u-flex u-padding-block-start-16 u-width-200',
            styles.docsSideNavSkeleton
        ),
        style: 'border-inline-end: 0.0625rem solid rgb(44, 44, 48)',
        bones: [Bones.boxAuto]
    });
