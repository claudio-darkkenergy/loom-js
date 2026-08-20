import {
    el,
    Picture,
    type ComponentInputProps,
    type PictureProps,
    simple,
    type TemplateTagValue
} from '@loom-js/core';
import {
    PinkButtonsList,
    PinkContainer,
    type PinkButtonProps
} from '@loom-js/pink';
import classNames from 'classnames';

import styles from './HeroBanner.module.css';

type HeroBannerProps = ComponentInputProps<{
    ctas?: PinkButtonProps[];
    description?: TemplateTagValue;
    imgProps?: PictureProps;
    title?: TemplateTagValue;
}>;

// Functional form: page layouts consume HeroBanner as a children-array item,
// and a component-tag-rooted template would render as a fragment — the
// documented forbidden shape for array items.
export const HeroBanner = simple<HeroBannerProps>(
    ({ ctas, description, imgProps, title, ...props }) =>
        PinkContainer({
            ...props,
            attrs: { role: 'banner' },
            className: classNames(
                'u-gap-32 u-grid u-text-center',
                styles.heroBanner
            ),
            is: el('section'),
            children: [
                imgProps && Picture(imgProps),
                el('div')({
                    className: classNames(
                        'u-flex-vertical u-gap-24',
                        styles.content
                    ),
                    children: [
                        el('h1')({
                            children: title,
                            className: 'heading-level-3'
                        }),
                        el('p')({
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
        })
);
