import {
    type ComponentInputProps,
    el,
    simple,
    type SimpleComponent
} from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';

export type PinkTableSectionProps = ComponentInputProps<PinkDynamicProps>;

// The three row-group sections share one shape — a class-adding delegator
// whose default root is the matching native section element.
const tableSection = (
    sectionTag: string,
    sectionClassName: string
): SimpleComponent<PinkTableSectionProps> =>
    simple<PinkTableSectionProps>(
        ({ className, is = el(sectionTag), ...props }) =>
            is({
                ...props,
                className: classNames(className, sectionClassName)
            })
    );

export const PinkTableHead = tableSection('thead', 'table-thead');
export const PinkTableBody = tableSection('tbody', 'table-tbody');
export const PinkTableFoot = tableSection('tfoot', 'table-tfoot');
