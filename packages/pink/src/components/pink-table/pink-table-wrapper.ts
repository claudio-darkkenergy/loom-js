import { type ComponentInputProps, el, simple } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';

export type PinkTableWrapperProps = ComponentInputProps<
    PinkDynamicProps & {
        withScroll?: boolean;
    }
>;

/**
 * Overflow containment for wide tables. The default (`table-wrapper`) simply
 * scrolls; `withScroll` opts into upstream's `table-with-scroll` treatment,
 * which keeps the rounded-corner clipping while scrolling.
 */
export const PinkTableWrapper = simple<PinkTableWrapperProps>(
    ({ className, is = el('div'), withScroll, ...props }) =>
        is({
            ...props,
            className: classNames(
                className,
                withScroll ? 'table-with-scroll' : 'table-wrapper'
            )
        })
);
