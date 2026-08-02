import type { SimpleComponent } from '@loom-js/core';
import { Div, type DivProps } from '@loom-js/tags';
import classNames from 'classnames';

import { PinkBox, type PinkBoxProps } from '../pink-box';

export type PinkBoxesProps = DivProps & {
    boxProps: PinkBoxProps[];
};

export const PinkBoxes: SimpleComponent<PinkBoxesProps> = ({
    className,
    boxProps,
    ...divProps
}) =>
    Div({
        ...divProps,
        children: boxProps.map((props) => PinkBox(props)),
        className: classNames(className, 'boxes-wrapper')
    });
