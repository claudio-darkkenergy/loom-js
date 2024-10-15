import styles from './HeroBanner.module.css';
import type { TemplateTagValue, SimpleComponent } from '@loom-js/core';
import {
    PinkButtonsList,
    PinkContainer,
    type PinkContainerProps,
    type PinkButtonProps
} from '@loom-js/pink';
import { Div, H1, Img, type ImgProps, Paragraph, Section } from '@loom-js/tags';
import classNames from 'classnames';

type HeroBannerProps = PinkContainerProps & {
    ctas?: PinkButtonProps[];
    description?: TemplateTagValue;
    imgProps?: ImgProps;
    title?: TemplateTagValue;
};

export const HeroBanner: SimpleComponent<HeroBannerProps> = ({
    ctas,
    description,
    imgProps,
    title,
    ...props
}) =>
    PinkContainer({
        ...props,
        className: classNames(
            'u-gap-32 u-grid u-text-center',
            styles.heroBanner
        ),
        is: Section,
        role: 'banner',
        children: [
            imgProps && Img(imgProps),
            Div({
                className: classNames(
                    'u-flex-vertical u-gap-24',
                    styles.content
                ),
                children: [
                    H1({
                        children: title,
                        className: 'heading-level-3'
                    }),
                    Paragraph({
                        children: description
                    }),
                    ctas &&
                        PinkButtonsList({
                            className: 'u-main-center',
                            itemProps: ctas
                        })
                ]
            })
        ]
    });
