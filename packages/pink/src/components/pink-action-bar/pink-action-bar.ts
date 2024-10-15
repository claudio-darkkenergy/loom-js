import { type SimpleComponent } from '@loom-js/core';
import { Div, type DivProps, Section } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkActionBarProps = {
    startContent?: DivProps;
    endContent?: DivProps;
};

export const PinkActionBar: SimpleComponent<PinkActionBarProps> = ({
    startContent,
    endContent
}) =>
    Section({
        children: [
            Div({
                ...startContent,
                className: classNames(
                    'action-bar-start u-flex u-gap-8',
                    startContent?.className
                )
            }),
            Div({
                ...endContent,
                className: classNames(
                    'action-bar-end u-flex u-gap-8',
                    endContent?.className
                )
            })
        ],
        className: 'action-bar'
    });
