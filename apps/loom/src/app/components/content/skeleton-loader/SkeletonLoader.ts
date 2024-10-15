import styles from './SkeletonLoader.module.css';
import { SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

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

export type SkeletonLoaderProps = {
    bones: Bones[];
};

export const SkeletonLoader: SimpleComponent<SkeletonLoaderProps> = ({
    bones,
    className,
    style
}) =>
    Div({
        className: classNames(className, styles.skeletonLoader, styles.animate),
        style,
        children: bones.map((bone) => {
            if (
                [
                    Bones.details,
                    Bones.detailsDouble,
                    Bones.detailsSingle
                ].includes(bone)
            ) {
                const lineCount =
                    bone === Bones.detailsDouble
                        ? 2
                        : bone === Bones.detailsSingle
                          ? 1
                          : 3;
                return Div({
                    className: styles.details,
                    children: Array(lineCount).fill(Div())
                });
            }

            return Div({
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
                    [styles._main]: [
                        Bones.mainHeading,
                        Bones.mainHeadingLong
                    ].includes(bone),
                    [styles._long]: [
                        Bones.headingLong,
                        Bones.mainHeadingLong
                    ].includes(bone)
                })
            });
        })
    });
