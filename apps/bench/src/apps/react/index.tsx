// The react implementation: hooks, memoized keyed rows.
import { memo, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

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

interface BenchRowProps {
    row: Row;
    selected: boolean;
    onSelect: (id: number) => void;
    onRemove: (id: number) => void;
}

const BenchRow = memo(
    ({ row, selected, onSelect, onRemove }: BenchRowProps) => (
        <tr
            className={
                selected ? `${CLASSES.row} ${CLASSES.selected}` : CLASSES.row
            }
        >
            <td className={CLASSES.id}>{row.id}</td>
            <td className={CLASSES.label}>
                <a
                    className={CLASSES.labelLink}
                    onClick={() => onSelect(row.id)}
                >
                    {row.label}
                </a>
            </td>
            <td className={CLASSES.action}>
                <button
                    type="button"
                    className={CLASSES.remove}
                    onClick={() => onRemove(row.id)}
                >
                    remove
                </button>
            </td>
        </tr>
    )
);

const Bench = () => {
    const [rows, setRows] = useState<Row[]>([]);
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    const createRows = (count: number) => {
        setSelectedId(undefined);
        setRows(buildData(count));
    };
    const onSelect = useCallback((id: number) => setSelectedId(id), []);

    // After the first commit, not after `render()` returns — react commits async.
    useEffect(markReady, []);
    const onRemove = useCallback(
        (id: number) =>
            setRows((current) => current.filter((row) => row.id !== id)),
        []
    );

    return (
        <div>
            <div className="toolbar">
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
                        setRows(rows.concat(buildData(ROW_COUNTS.add)))
                    }
                >
                    Append 1,000 rows
                </button>
                <button
                    id={BUTTONS.update}
                    type="button"
                    onClick={() => setRows(updateEveryTenth(rows))}
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
                    onClick={() => setRows(swapSecondAndPenultimate(rows))}
                >
                    Swap rows
                </button>
            </div>
            <table className={CLASSES.table}>
                <tbody>
                    {rows.map((row) => (
                        <BenchRow
                            key={row.id}
                            row={row}
                            selected={row.id === selectedId}
                            onSelect={onSelect}
                            onRemove={onRemove}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

createRoot(document.getElementById('app') as HTMLElement).render(<Bench />);
