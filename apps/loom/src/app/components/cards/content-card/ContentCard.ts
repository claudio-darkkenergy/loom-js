import {
    component,
    Picture,
    type ComponentInputProps,
    type PictureProps,
    type TemplateTagValue
} from '@loom-js/core';
import { PinkCard } from '@loom-js/pink';
import classNames from 'classnames';

import styles from './ContentCard.module.css';

export type ContentCardProps = ComponentInputProps<{
    description?: TemplateTagValue;
    title?: string;
    bgImageProps?: PictureProps;
}>;

export const ContentCard = component<ContentCardProps>(
    (html, { bgImageProps, className, description, title }) => html`
        <${PinkCard} className=${classNames(styles.contentCard, className)}>
            ${
                bgImageProps &&
                Picture({
                    ...bgImageProps,
                    // The retired tags Img always emitted these defaults.
                    height: bgImageProps.height ?? 'auto',
                    width: bgImageProps.width ?? 'auto'
                })
            }
            <h3 class="heading-level-6">${title}</h3>
            <p>${description}</p>
        </>
    `
);
