import type { SimpleComponent } from '@loom-js/core';
import { Div, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkBoxProps = DivProps;

export const PinkBox: SimpleComponent<PinkBoxProps> = ({
    className,
    ...divProps
}) =>
    Div({
        ...divProps,
        className: classNames(className, 'box')
    });
