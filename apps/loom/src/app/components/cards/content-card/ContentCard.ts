import styles from './ContentCard.module.css';
import type { TemplateTagValue, SimpleComponent } from '@loom-js/core';
import { PinkCard } from '@loom-js/pink';
import { H3, Img, Paragraph, type ImgProps } from '@loom-js/tags';
import classNames from 'classnames';

export type ContentCardProps = {
    description?: TemplateTagValue;
    title?: string;
    bgImageProps?: ImgProps;
};

export const ContentCard: SimpleComponent<ContentCardProps> = ({
    bgImageProps,
    className,
    description,
    title,
    ...props
}) => {
    return PinkCard({
        ...props,
        className: classNames(styles.contentCard, className),
        children: [
            bgImageProps && Img(bgImageProps),
            H3({
                className: 'heading-level-6',
                children: title
            }),
            Paragraph({ children: description })
        ]
    });
};
