<script setup lang="ts">
import { ref, shallowRef } from 'vue';

import {
    BUTTONS,
    CLASSES,
    ROW_COUNTS,
    type Row,
    buildData,
    swapSecondAndPenultimate,
    updateEveryTenth
} from '../../shared';

const rows = shallowRef<Row[]>([]);
const selectedId = ref<number | undefined>(undefined);

const createRows = (count: number) => {
    selectedId.value = undefined;
    rows.value = buildData(count);
};
const appendRows = () => {
    rows.value = rows.value.concat(buildData(ROW_COUNTS.add));
};
const updateRows = () => {
    rows.value = updateEveryTenth(rows.value);
};
const swapRows = () => {
    rows.value = swapSecondAndPenultimate(rows.value);
};
const removeRow = (id: number) => {
    rows.value = rows.value.filter((row) => row.id !== id);
};
</script>

<template>
    <div>
        <div class="toolbar">
            <button
                :id="BUTTONS.run"
                type="button"
                @click="createRows(ROW_COUNTS.run)"
            >
                Create 1,000 rows
            </button>
            <button
                :id="BUTTONS.runLots"
                type="button"
                @click="createRows(ROW_COUNTS.runLots)"
            >
                Create 10,000 rows
            </button>
            <button :id="BUTTONS.add" type="button" @click="appendRows">
                Append 1,000 rows
            </button>
            <button :id="BUTTONS.update" type="button" @click="updateRows">
                Update every 10th row
            </button>
            <button :id="BUTTONS.clear" type="button" @click="createRows(0)">
                Clear
            </button>
            <button :id="BUTTONS.swapRows" type="button" @click="swapRows">
                Swap rows
            </button>
        </div>
        <table :class="CLASSES.table">
            <tbody>
                <tr
                    v-for="row in rows"
                    :key="row.id"
                    :class="[
                        CLASSES.row,
                        { [CLASSES.selected]: row.id === selectedId }
                    ]"
                >
                    <td :class="CLASSES.id">{{ row.id }}</td>
                    <td :class="CLASSES.label">
                        <a
                            :class="CLASSES.labelLink"
                            @click="selectedId = row.id"
                        >
                            {{ row.label }}
                        </a>
                    </td>
                    <td :class="CLASSES.action">
                        <button
                            type="button"
                            :class="CLASSES.remove"
                            @click="removeRow(row.id)"
                        >
                            remove
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
