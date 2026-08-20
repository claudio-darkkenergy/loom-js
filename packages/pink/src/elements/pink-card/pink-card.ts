import { el, type ComponentInputProps, simple } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';

export type PinkCardProps = ComponentInputProps<
    PinkDynamicProps & {
        isBorderDashed?: boolean;
        isAllowFocus?: boolean;
    }
>;

// Pure delegation — no markup of its own, so no template (and no extra
// component context): the root element comes entirely from `is`.
export const PinkCard = simple<PinkCardProps>(
    ({ className, is = el('div'), isAllowFocus, isBorderDashed, ...props }) =>
        is({
            ...props,
            className: classNames(className, 'card', {
                'is-border-dashed': isBorderDashed,
                'is-allow-focus': isAllowFocus
            })
        })
);
