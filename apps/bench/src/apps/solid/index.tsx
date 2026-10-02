// The solid implementation: signals and `<For>`, keyed by reference.
import { createSignal, For } from 'solid-js';
import { render } from 'solid-js/web';

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

const Bench = () => {
    const [rows, setRows] = createSignal<Row[]>([]);
    const [selectedId, setSelectedId] = createSignal<number | undefined>(
        undefined
    );

    const createRows = (count: number) => {
        setSelectedId(undefined);
        setRows(buildData(count));
    };

    return (
        <div>
            <div class="toolbar">
                <button
                    id={BUTTONS.run}
                    type="button"
                    onClick={() => createRows(ROW_COUNTS.run)}
                >
                    Create 1,000 rows
                </button>
                <button
                    id={BUTTONS.runLots}
                    type="button"
                    onClick={() => createRows(ROW_COUNTS.runLots)}
                >
                    Create 10,000 rows
                </button>
                <button
                    id={BUTTONS.add}
                    type="button"
                    onClick={() =>
                        setRows(rows().concat(buildData(ROW_COUNTS.add)))
                    }
                >
                    Append 1,000 rows
                </button>
                <button
                    id={BUTTONS.update}
                    type="button"
                    onClick={() => setRows(updateEveryTenth(rows()))}
                >
                    Update every 10th row
                </button>
                <button
                    id={BUTTONS.clear}
                    type="button"
                    onClick={() => createRows(0)}
                >
                    Clear
                </button>
                <button
                    id={BUTTONS.swapRows}
                    type="button"
                    onClick={() => setRows(swapSecondAndPenultimate(rows()))}
                >
                    Swap rows
                </button>
            </div>
            <table class={CLASSES.table}>
                <tbody>
                    <For each={rows()}>
                        {(row) => (
                            <tr
                                classList={{
                                    [CLASSES.row]: true,
                                    [CLASSES.selected]: row.id === selectedId()
                                }}
                            >
                                <td class={CLASSES.id}>{row.id}</td>
                                <td class={CLASSES.label}>
                                    <a
                                        class={CLASSES.labelLink}
                                        onClick={() => setSelectedId(row.id)}
                                    >
                                        {row.label}
                                    </a>
                                </td>
                                <td class={CLASSES.action}>
                                    <button
                                        type="button"
                                        class={CLASSES.remove}
                                        onClick={() =>
                                            setRows(
                                                rows().filter(
                                                    (candidate) =>
                                                        candidate.id !== row.id
                                                )
                                            )
                                        }
                                    >
                                        remove
                                    </button>
                                </td>
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div>
    );
};

render(() => <Bench />, document.getElementById('app') as HTMLElement);
markReady();
