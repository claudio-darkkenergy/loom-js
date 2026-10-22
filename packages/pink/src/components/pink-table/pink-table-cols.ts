import {
    type ComponentInputProps,
    el,
    simple,
    type SimpleComponent
} from '@loom-js/core';

import type { PinkDynamicProps } from '../../types';
import { cn } from '../../utils/cn';

export type PinkTableCellProps = ComponentInputProps<PinkDynamicProps>;

// Both cell kinds are class-adding delegators over their native cell element.
const tableCell = (
    cellTag: string,
    cellClassName: string
): SimpleComponent<PinkTableCellProps> =>
    simple<PinkTableCellProps>(({ className, is = el(cellTag), ...props }) =>
        is({
            ...props,
            className: cn(className, cellClassName)
        })
    );

export const PinkTableCol = tableCell('td', 'table-col');
export const PinkTableHeadCol = tableCell('th', 'table-thead-col');
