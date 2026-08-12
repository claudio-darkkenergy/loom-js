import {
    el,
    type ComponentInputProps,
    type SimpleComponent
} from '@loom-js/core';
import classNames from 'classnames';

import { PinkDynamicProps } from '../../types';

export type PinkContainerProps = ComponentInputProps<PinkDynamicProps>;

// Pure delegation — no markup of its own, so no template (and no extra
// component context): the root element comes entirely from `is`.
export const PinkContainer: SimpleComponent<PinkContainerProps> = ({
    attrs,
    children,
    className,
    id,
    is = el('div'),
    on,
    style
}) =>
    is({
        attrs,
        children,
        className: classNames(className, 'container'),
        id,
        on,
        style
    });
