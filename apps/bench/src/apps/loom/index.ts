// The loom implementation: declarative `component` + `activity`, keyed rows,
// the selection as an attribute binding so selecting never re-renders a row.
import { activity, component, init } from '@loom-js/core';

import {
    BUTTONS,
    CLASSES,
    markReady,
    ROW_COUNTS,
    type Row,
    buildData,
    swapSecondAndPenultimate,
    updateEveryTenth
} from '../../shared';

const rows = activity<Row[]>([]);
const selectedId = activity<number | undefined>(undefined);

const createRows = (count: number) => {
    selectedId.update(undefined);
    rows.update(buildData(count));
};

const appendRows = () =>
    rows.update(rows.value().concat(buildData(ROW_COUNTS.add)));
const updateRows = () => rows.update(updateEveryTenth(rows.value()));
const clearRows = () => {
    selectedId.update(undefined);
    rows.update([]);
};
const swapRows = () => rows.update(swapSecondAndPenultimate(rows.value()));
const removeRow = (id: number) =>
    rows.update(rows.value().filter((row) => row.id !== id));

const rowClass = (id: number) =>
    selectedId.bind((selected) =>
        selected === id ? `${CLASSES.row} ${CLASSES.selected}` : CLASSES.row
    );

// `id` is a reserved component prop (the root element's id), so the row's
// identity travels as `rowId`.
const BenchRow = component<{ rowId: number; label: string }>(
    (html, { rowId, label }) => html`
        <tr class=${rowClass(rowId)}>
            <td class=${CLASSES.id}>${rowId}</td>
            <td class=${CLASSES.label}>
                <a
                    class=${CLASSES.labelLink}
                    $click=${() => selectedId.update(rowId)}
                >
                    ${label}
                </a>
            </td>
            <td class=${CLASSES.action}>
                <button
                    type="button"
                    class=${CLASSES.remove}
                    $click=${() => removeRow(rowId)}
                >
                    remove
                </button>
            </td>
        </tr>
    `
);

const Bench = component(
    (html) => html`
        <div>
            <div class="toolbar">
                <button
                    id=${BUTTONS.run}
                    type="button"
                    $click=${() => createRows(ROW_COUNTS.run)}
                >
                    Create 1,000 rows
                </button>
                <button
                    id=${BUTTONS.runLots}
                    type="button"
                    $click=${() => createRows(ROW_COUNTS.runLots)}
                >
                    Create 10,000 rows
                </button>
                <button id=${BUTTONS.add} type="button" $click=${appendRows}>
                    Append 1,000 rows
                </button>
                <button id=${BUTTONS.update} type="button" $click=${updateRows}>
                    Update every 10th row
                </button>
                <button id=${BUTTONS.clear} type="button" $click=${clearRows}>
                    Clear
                </button>
                <button id=${BUTTONS.swapRows} type="button" $click=${swapRows}>
                    Swap rows
                </button>
            </div>
            <table class=${CLASSES.table}>
                <tbody>
                    ${rows.effect(({ value }) =>
                        value.map(({ id, label }) =>
                            BenchRow({ key: id, label, rowId: id })
                        )
                    )}
                </tbody>
            </table>
        </div>
    `
);

init({
    app: Bench(),
    onAppMounted: markReady,
    root: document.getElementById('app')
});
