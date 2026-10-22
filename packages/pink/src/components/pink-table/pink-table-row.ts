import { type ComponentInputProps, el, simple } from '@loom-js/core';

import type { PinkDynamicProps } from '../../types';
import { cn } from '../../utils/cn';

export type PinkTableRowProps = ComponentInputProps<PinkDynamicProps>;

/**
 * A table row. The default root is a `<tr>`; pass `is` to render an
 * interactive row instead (upstream styles rows that are anchors or carry a
 * button role with hover/focus treatment).
 */
export const PinkTableRow = simple<PinkTableRowProps>(
    ({ className, is = el('tr'), ...props }) =>
        is({
            ...props,
            className: cn(className, 'table-row')
        })
);
