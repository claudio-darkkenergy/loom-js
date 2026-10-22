import { el, type ComponentInputProps, simple } from '@loom-js/core';

import { PinkDynamicProps } from '../../types';
import { cn } from '../../utils/cn';

export type PinkContainerProps = ComponentInputProps<PinkDynamicProps>;

// Pure delegation — no markup of its own, so no template (and no extra
// component context): the root element comes entirely from `is`.
export const PinkContainer = simple<PinkContainerProps>(
    ({ attrs, children, className, id, is = el('div'), on, style }) =>
        is({
            attrs,
            children,
            className: cn(className, 'container'),
            id,
            on,
            style
        })
);
