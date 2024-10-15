import type { ComponentProps, SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkBoxProps = ComponentProps;

export const PinkBox: SimpleComponent<PinkBoxProps> = ({
    className,
    ...divProps
}) =>
    Div({
        ...divProps,
        className: classNames(className, 'box')
    });
