import { PinkCard } from '../../elements/pink-card';
import type { SimpleComponent, TemplateTagValue } from '@loom-js/core';
import { Div, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkGridItemProps = Omit<DivProps, 'children'> & {
    className?: string;
    bottomLeft?: TemplateTagValue;
    bottomRight?: TemplateTagValue;
    topLeft?: TemplateTagValue;
    topRight?: TemplateTagValue;
};

export const PinkGridItem: SimpleComponent<PinkGridItemProps> = ({
    className,
    bottomLeft,
    bottomRight,
    topLeft,
    topRight,
    ...props
}) => {
    return PinkCard({
        ...props,
        className: classNames('u-margin-auto', className),
        children: Div({
            className: 'grid-item-1',
            children: [
                topLeft &&
                    Div({
                        className: 'grid-item-1-start-start',
                        children: topLeft,
                        key: 'topLeft'
                    }),
                topRight &&
                    Div({
                        className: 'grid-item-1-start-end',
                        children: topRight,
                        key: 'topRight'
                    }),
                bottomLeft &&
                    Div({
                        className: 'grid-item-1-end-start',
                        children: bottomLeft,
                        key: 'bottomLeft'
                    }),
                bottomRight &&
                    Div({
                        className: 'grid-item-1-end-end',
                        children: bottomRight,
                        key: 'bottomRight'
                    })
            ].filter(Boolean)
        })
    });
};
