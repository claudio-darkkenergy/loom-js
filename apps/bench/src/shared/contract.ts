// The DOM contract: every implementation renders these ids and classes, and
// the runner drives the page through them like a user would — no framework
// exposes a hook.

export const BUTTONS = {
    /** Create 1,000 rows. */
    run: 'run',
    /** Create 10,000 rows (unused by the runner; kept for manual runs). */
    runLots: 'runlots',
    /** Append 1,000 rows. */
    add: 'add',
    /** Update every 10th row's label. */
    update: 'update',
    /** Remove every row. */
    clear: 'clear',
    /** Swap rows 1 and 998. */
    swapRows: 'swaprows'
} as const;

export const CLASSES = {
    table: 'bench-table',
    row: 'bench-row',
    selected: 'selected',
    id: 'col-id',
    label: 'col-label',
    labelLink: 'lbl',
    action: 'col-action',
    remove: 'remove'
} as const;

export const ROW_COUNTS = {
    run: 1000,
    runLots: 10000,
    add: 1000
} as const;

/** The performance mark each app sets once its initial UI is on screen. */
export const READY_MARK = 'bench:ready';

/**
 * Call once after the initial UI has mounted. The mark lands on the frame
 * after mount, so every framework's startup is measured to the same point.
 */
export const markReady = () => {
    requestAnimationFrame(() => performance.mark(READY_MARK));
};
