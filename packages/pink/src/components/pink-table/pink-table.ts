import { type ComponentInputProps, el, simple } from '@loom-js/core';
import classNames from 'classnames';

import type { PinkDynamicProps } from '../../types';
import { PinkTableCol, PinkTableHeadCol } from './pink-table-cols';
import { PinkTableRow } from './pink-table-row';
import {
    PinkTableBody,
    PinkTableFoot,
    PinkTableHead
} from './pink-table-sections';
import { PinkTableWrapper } from './pink-table-wrapper';

export type PinkTableProps = ComponentInputProps<
    PinkDynamicProps & {
        isRemoveOuterStyles?: boolean;
        isStickyScroll?: boolean;
        isTableLayoutAuto?: boolean;
        isTableRowMediumSize?: boolean;
        isVertical?: boolean;
    }
>;

/**
 * Tables display structured data in rows and columns. Compose with the
 * sub-components: `PinkTable.Head`/`Body`/`Foot` for row groups,
 * `PinkTable.Row` for rows, `PinkTable.HeadCol`/`Col` for cells, and
 * `PinkTable.Wrapper` for overflow containment. The default root is a
 * `<table>`; upstream also styles `<ul>`-based list tables via `is`.
 */
const PinkTableRoot = simple<PinkTableProps>(
    ({
        className,
        is = el('table'),
        isRemoveOuterStyles,
        isStickyScroll,
        isTableLayoutAuto,
        isTableRowMediumSize,
        isVertical,
        ...props
    }) =>
        is({
            ...props,
            className: classNames(className, 'table', {
                'is-remove-outer-styles': isRemoveOuterStyles,
                'is-sticky-scroll': isStickyScroll,
                'is-table-layout-auto': isTableLayoutAuto,
                'is-table-row-medium-size': isTableRowMediumSize,
                'is-vertical': isVertical
            })
        })
);

export const PinkTable = Object.assign(PinkTableRoot, {
    Body: PinkTableBody,
    Col: PinkTableCol,
    Foot: PinkTableFoot,
    Head: PinkTableHead,
    HeadCol: PinkTableHeadCol,
    Row: PinkTableRow,
    Wrapper: PinkTableWrapper
});
