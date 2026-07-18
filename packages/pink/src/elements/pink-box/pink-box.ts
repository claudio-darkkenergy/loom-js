import type { ComponentInputProps, SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkBoxProps = ComponentInputProps;

export const PinkBox: SimpleComponent<PinkBoxProps> = ({
    className,
    ...divProps
}) =>
    Div({
        ...divProps,
        className: classNames(className, 'box')
    });
