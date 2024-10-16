import { PinkDynamicProps } from '../../types';
import { SimpleComponent } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkContainerProps = PinkDynamicProps;

export const PinkContainer: SimpleComponent<PinkContainerProps> = ({
    className,
    is = Div,
    ...containerProps
}) =>
    is({
        ...containerProps,
        className: classNames(className, 'container')
    });
