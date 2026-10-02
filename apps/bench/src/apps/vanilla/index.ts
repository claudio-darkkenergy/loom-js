// The floor: hand-written DOM code with keyed rows, no framework.
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

const app = document.getElementById('app') as HTMLElement;

const toolbar = document.createElement('div');

toolbar.className = 'toolbar';

const button = (id: string, text: string) => {
    const element = document.createElement('button');

    element.id = id;
    element.type = 'button';
    element.textContent = text;
    toolbar.appendChild(element);

    return element;
};

const runButton = button(BUTTONS.run, 'Create 1,000 rows');
const runLotsButton = button(BUTTONS.runLots, 'Create 10,000 rows');
const addButton = button(BUTTONS.add, 'Append 1,000 rows');
const updateButton = button(BUTTONS.update, 'Update every 10th row');
const clearButton = button(BUTTONS.clear, 'Clear');
const swapButton = button(BUTTONS.swapRows, 'Swap rows');

const table = document.createElement('table');
const tbody = document.createElement('tbody');

table.className = CLASSES.table;
table.appendChild(tbody);
app.append(toolbar, table);

let rows: Row[] = [];
let selectedId: number | undefined;
const rowElements = new Map<number, HTMLTableRowElement>();

const rowTemplate = document.createElement('template');

rowTemplate.innerHTML = `<tr class="${CLASSES.row}"><td class="${CLASSES.id}"></td><td class="${CLASSES.label}"><a class="${CLASSES.labelLink}"></a></td><td class="${CLASSES.action}"><button type="button" class="${CLASSES.remove}">remove</button></td></tr>`;

const createRowElement = ({ id, label }: Row) => {
    const element = (
        rowTemplate.content.firstElementChild as HTMLElement
    ).cloneNode(true) as HTMLTableRowElement;
    const [idCell, labelCell] = element.children;

    (idCell as HTMLElement).textContent = String(id);
    (labelCell?.firstElementChild as HTMLElement).textContent = label;
    rowElements.set(id, element);

    return element;
};

const render = (next: Row[]) => {
    rows = next;

    const fragment = document.createDocumentFragment();

    rowElements.clear();

    for (const row of rows) {
        fragment.appendChild(createRowElement(row));
    }

    tbody.replaceChildren(fragment);
};

const setSelected = (id: number | undefined) => {
    if (selectedId !== undefined) {
        rowElements.get(selectedId)?.classList.remove(CLASSES.selected);
    }

    selectedId = id;

    if (id !== undefined) {
        rowElements.get(id)?.classList.add(CLASSES.selected);
    }
};

runButton.addEventListener('click', () => {
    setSelected(undefined);
    render(buildData(ROW_COUNTS.run));
});

runLotsButton.addEventListener('click', () => {
    setSelected(undefined);
    render(buildData(ROW_COUNTS.runLots));
});

addButton.addEventListener('click', () => {
    const added = buildData(ROW_COUNTS.add);
    const fragment = document.createDocumentFragment();

    rows = rows.concat(added);

    for (const row of added) {
        fragment.appendChild(createRowElement(row));
    }

    tbody.appendChild(fragment);
});

updateButton.addEventListener('click', () => {
    rows = updateEveryTenth(rows);

    for (let index = 0; index < rows.length; index += 10) {
        const row = rows[index] as Row;
        const label = rowElements
            .get(row.id)
            ?.querySelector(`.${CLASSES.labelLink}`);

        if (label) {
            label.textContent = row.label;
        }
    }
});

clearButton.addEventListener('click', () => {
    setSelected(undefined);
    render([]);
});

swapButton.addEventListener('click', () => {
    if (rows.length <= 998) {
        return;
    }

    const first = rowElements.get((rows[1] as Row).id) as HTMLElement;
    const second = rowElements.get((rows[998] as Row).id) as HTMLElement;
    const firstNext = first.nextSibling;

    tbody.insertBefore(first, second);
    tbody.insertBefore(second, firstNext);
    rows = swapSecondAndPenultimate(rows);
});

tbody.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const rowElement = target.closest(`.${CLASSES.row}`) as HTMLElement | null;

    if (!rowElement) {
        return;
    }

    const id = Number(rowElement.firstElementChild?.textContent);

    if (target.classList.contains(CLASSES.remove)) {
        rows = rows.filter((row) => row.id !== id);
        rowElements.delete(id);
        rowElement.remove();

        if (selectedId === id) {
            selectedId = undefined;
        }

        return;
    }

    if (target.classList.contains(CLASSES.labelLink)) {
        setSelected(id);
    }
});

markReady();
