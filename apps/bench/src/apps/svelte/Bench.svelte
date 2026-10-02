<script lang="ts">
    import {
        BUTTONS,
        CLASSES,
        ROW_COUNTS,
        type Row,
        buildData,
        swapSecondAndPenultimate,
        updateEveryTenth
    } from '../../shared';

    let rows = $state.raw<Row[]>([]);
    let selectedId = $state<number | undefined>(undefined);

    const createRows = (count: number) => {
        selectedId = undefined;
        rows = buildData(count);
    };
    const appendRows = () => {
        rows = rows.concat(buildData(ROW_COUNTS.add));
    };
    const updateRows = () => {
        rows = updateEveryTenth(rows);
    };
    const swapRows = () => {
        rows = swapSecondAndPenultimate(rows);
    };
    const removeRow = (id: number) => {
        rows = rows.filter((row) => row.id !== id);
    };
</script>

<div>
    <div class="toolbar">
        <button id={BUTTONS.run} type="button" onclick={() => createRows(ROW_COUNTS.run)}>Create 1,000 rows</button>
        <button id={BUTTONS.runLots} type="button" onclick={() => createRows(ROW_COUNTS.runLots)}>Create 10,000 rows</button>
        <button id={BUTTONS.add} type="button" onclick={appendRows}>Append 1,000 rows</button>
        <button id={BUTTONS.update} type="button" onclick={updateRows}>Update every 10th row</button>
        <button id={BUTTONS.clear} type="button" onclick={() => createRows(0)}>Clear</button>
        <button id={BUTTONS.swapRows} type="button" onclick={swapRows}>Swap rows</button>
    </div>
    <table class={CLASSES.table}>
        <tbody>
            {#each rows as row (row.id)}
                <tr class={[CLASSES.row, row.id === selectedId && CLASSES.selected]}>
                    <td class={CLASSES.id}>{row.id}</td>
                    <td class={CLASSES.label}>
                        <a class={CLASSES.labelLink} onclick={() => (selectedId = row.id)}>{row.label}</a>
                    </td>
                    <td class={CLASSES.action}>
                        <button type="button" class={CLASSES.remove} onclick={() => removeRow(row.id)}>remove</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
