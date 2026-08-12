import { component, el, type ComponentInputProps } from '@loom-js/core';
import classNames from 'classnames';

import styles from './SkeletonLoader.module.css';

export enum Bones {
    box = 'box',
    boxAuto = 'boxAuto',
    boxTall = 'boxTall',
    boxXTall = 'boxXTall',
    details = 'details',
    detailsDouble = 'detailsDouble',
    detailsSingle = 'detailsSingle',
    heading = 'heading',
    headingLong = 'headingLong',
    mainHeading = 'mainHeading',
    mainHeadingLong = 'mainHeadingLong'
}

export type SkeletonLoaderProps = ComponentInputProps<{
    bones: Bones[];
}>;

const renderBone = (bone: Bones) => {
    if (
        [Bones.details, Bones.detailsDouble, Bones.detailsSingle].includes(bone)
    ) {
        const lineCount =
            bone === Bones.detailsDouble
                ? 2
                : bone === Bones.detailsSingle
                  ? 1
                  : 3;
        return el('div')({
            className: styles.details,
            children: Array(lineCount).fill(el('div')({}))
        });
    }

    return el('div')({
        className: classNames({
            [styles.box]: [
                Bones.box,
                Bones.boxAuto,
                Bones.boxTall,
                Bones.boxXTall
            ].includes(bone),
            [styles._auto]: bone === Bones.boxAuto,
            [styles._tall]: bone === Bones.boxTall,
            [styles._xTall]: bone === Bones.boxXTall,
            [styles.heading]: [
                Bones.heading,
                Bones.headingLong,
                Bones.mainHeading,
                Bones.mainHeadingLong
            ].includes(bone),
            [styles._main]: [Bones.mainHeading, Bones.mainHeadingLong].includes(
                bone
            ),
            [styles._long]: [Bones.headingLong, Bones.mainHeadingLong].includes(
                bone
            )
        })
    });
};

export const SkeletonLoader = component<SkeletonLoaderProps>(
    (html, { bones, className, style }) => html`
        <div
            class=${classNames(
                className,
                styles.skeletonLoader,
                styles.animate
            )}
            style=${style}
        >
            ${bones.map(renderBone)}
        </div>
    `
);
