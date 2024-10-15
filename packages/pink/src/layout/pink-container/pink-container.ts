import { PinkDynamicProps } from '../../types';
import { simple } from '@loom-js/core';
import { Div } from '@loom-js/tags';
import classNames from 'classnames';

export type PinkContainerProps = PinkDynamicProps;

export const PinkContainer = simple<PinkContainerProps>(function pinkContainer({
    className,
    is = Div,
    ...containerProps
}) {
    return is({
        ...containerProps,
        className: classNames(className, 'container')
    });
});
