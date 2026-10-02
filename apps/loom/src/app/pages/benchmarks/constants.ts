import type { OpId } from '@loom-js/bench';

/** What each op does, in the words the table shows. */
export const OP_LABELS: Record<OpId, string> = {
    createRows: 'Create 1,000 rows',
    replaceAll: 'Replace all 1,000 rows',
    partialUpdate: 'Update every 10th row',
    selectRow: 'Select a row',
    swapRows: 'Swap two rows',
    removeRow: 'Remove a row',
    clearRows: 'Clear 1,000 rows',
    appendRows: 'Append 1,000 rows'
};

export const BENCH_SOURCE_URL =
    'https://github.com/claudio-darkkenergy/loom-js/tree/main/apps/bench';
