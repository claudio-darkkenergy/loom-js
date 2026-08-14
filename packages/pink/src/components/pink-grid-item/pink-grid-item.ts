import {
    el,
    type ComponentInputProps,
    simple,
    type TemplateTagValue
} from '@loom-js/core';
import classNames from 'classnames';

import { PinkCard } from '../../elements/pink-card';

export type PinkGridItemProps = Omit<ComponentInputProps, 'children'> & {
    bottomLeft?: TemplateTagValue;
    bottomRight?: TemplateTagValue;
    topLeft?: TemplateTagValue;
    topRight?: TemplateTagValue;
};

export const PinkGridItem = simple<PinkGridItemProps>(
    ({ className, bottomLeft, bottomRight, topLeft, topRight, ...props }) => {
        return PinkCard({
            ...props,
            className: classNames('u-margin-auto', className),
            children: el('div')({
                className: 'grid-item-1',
                children: [
                    topLeft &&
                        el('div')({
                            className: 'grid-item-1-start-start',
                            children: topLeft,
                            key: 'topLeft'
                        }),
                    topRight &&
                        el('div')({
                            className: 'grid-item-1-start-end',
                            children: topRight,
                            key: 'topRight'
                        }),
                    bottomLeft &&
                        el('div')({
                            className: 'grid-item-1-end-start',
                            children: bottomLeft,
                            key: 'bottomLeft'
                        }),
                    bottomRight &&
                        el('div')({
                            className: 'grid-item-1-end-end',
                            children: bottomRight,
                            key: 'bottomRight'
                        })
                ].filter(Boolean)
            })
        });
    }
);
