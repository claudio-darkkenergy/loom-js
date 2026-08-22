import { expect } from '@esm-bundle/chai';

import { component, el } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// Specs for `table-aware-template-parsing`: table-part-rooted templates keep
// their authored root, and node-position interpolations inside table content
// stay in place instead of being foster-parented out of the table.

// A tr-rooted component template — body-context parsing strips this root.
const Row = component<{ label?: string }>(
    (html, { label }) => html`
        <tr data-row=${label}><td>${label}</td></tr>
    `
);

// Non-whitespace nodes preceding the table inside its parent — any
// foster-parented leak lands here.
const leakedNodesBefore = ($table: Element | null) => {
    const leaked: Node[] = [];
    let node = $table?.previousSibling ?? null;

    while (node) {
        if (node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()) {
            leaked.push(node);
        }

        node = node.previousSibling;
    }

    return leaked;
};

describe('table templates', () => {
    describe('table-part-rooted templates keep their authored root', () => {
        it('renders a tr-rooted component template as a <tr>', async () => {
            const TestComponent = component(
                (html) => html`
                    <table>
                        <tbody>${Row({ label: 'alpha' })}</tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $row = $test.querySelector('tbody > tr[data-row="alpha"]');

            expect($row, 'tr root survived parsing').to.exist;
            expect(
                $row?.querySelector('td')?.textContent,
                'authored td and its value are inside the row'
            ).to.contain('alpha');
        });

        it('renders a section-rooted (tbody) component template intact', async () => {
            const Body = component(
                (html) => html`
                    <tbody data-body>
                        <tr><td>one</td></tr>
                        <tr><td>two</td></tr>
                    </tbody>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <table>${Body()}</table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $body = $test.querySelector('table > tbody[data-body]');

            expect($body, 'tbody root survived parsing').to.exist;
            expect(
                $body?.querySelectorAll('tr').length,
                'authored rows intact'
            ).to.equal(2);
        });

        it('renders a td-rooted component template as a <td>', async () => {
            const Cell = component<{ value?: string }>(
                (html, { value }) => html`
                    <td data-cell>${value}</td>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <table>
                        <tbody>
                            <tr>${Cell({ value: 'cell-value' })}</tr>
                        </tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $cell = $test.querySelector('tr > td[data-cell]');

            expect($cell, 'td root survived parsing').to.exist;
            expect($cell?.textContent).to.contain('cell-value');
        });
    });

    describe('el() table-part tags render their named element', () => {
        it('renders el("tr") and el("td") in place', async () => {
            const TestComponent = component(
                (html) => html`
                    <table>
                        <tbody>
                            ${el('tr')({
                                children: el('td')({ children: 'el-cell' })
                            })}
                        </tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $row = $test.querySelector('tbody > tr');

            expect($row, 'el("tr") rendered a tr').to.exist;
            expect(
                $row?.querySelector('td')?.textContent,
                'el("td") rendered inside the row'
            ).to.contain('el-cell');
        });

        it('renders el("table") with dynamic section children in place', async () => {
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${el('table')({
                            children: el('tbody')({
                                children: [
                                    Row({ label: 'one' }),
                                    Row({ label: 'two' })
                                ]
                            })
                        })}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $table = $test.querySelector('main > table');

            expect($table, 'el("table") rendered').to.exist;
            expect(
                $table?.querySelectorAll('tbody > tr').length,
                'rows rendered inside the tbody'
            ).to.equal(2);
        });
    });

    describe('interpolations inside table content stay in place', () => {
        it('renders a dynamic row list inside <tbody> with no leaked nodes', async () => {
            const labels = ['alpha', 'beta', 'gamma'];
            const TestComponent = component(
                (html) => html`
                    <main>
                        <table>
                            <tbody>
                                ${labels.map((label) => Row({ label }))}
                            </tbody>
                        </table>
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $table = $test.querySelector('main > table');
            const $rows = $table?.querySelectorAll('tbody > tr') ?? [];

            expect(
                Array.from($rows).map(($row) => $row.getAttribute('data-row')),
                'all rows rendered inside the section, in order'
            ).to.deep.equal(labels);
            expect(
                leakedNodesBefore($table),
                'no foster-parented nodes precede the table'
            ).to.deep.equal([]);
        });

        it('reconciles row-list updates in place', async () => {
            const rows = activity(['one', 'two']);
            const TestComponent = component(
                (html) => html`
                    <table>
                        <tbody>
                            ${rows.effect(({ value }) =>
                                value.map((label) => Row({ key: label, label }))
                            )}
                        </tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $tbody = $test.querySelector('tbody');
            const $keptRow = $test.querySelector('tr[data-row="two"]');

            expect(
                $tbody?.querySelectorAll('tr').length,
                'initial rows rendered'
            ).to.equal(2);

            rows.update(['two', 'three']);

            const $rowsAfter = $tbody?.querySelectorAll('tr') ?? [];

            expect(
                Array.from($rowsAfter).map(($row) =>
                    $row.getAttribute('data-row')
                ),
                'updated rows reconciled inside the section'
            ).to.deep.equal(['two', 'three']);
            expect(
                $test.querySelector('tr[data-row="two"]'),
                'retained row node reused in place'
            ).to.equal($keptRow);
        });
    });

    describe('text-allowing table positions are unaffected', () => {
        it('resolves tokens inside td, th, and caption as text slots', async () => {
            const TestComponent = component(
                (html) => html`
                    <table>
                        <caption>${'the-caption'}</caption>
                        <thead>
                            <tr><th>${'the-header'}</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>${'the-cell'}</td></tr>
                        </tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect($test.querySelector('caption')?.textContent).to.contain(
                'the-caption'
            );
            expect($test.querySelector('th')?.textContent).to.contain(
                'the-header'
            );
            expect($test.querySelector('td')?.textContent).to.contain(
                'the-cell'
            );
        });

        it('resolves attribute-value tokens on table-part tags', async () => {
            const TestComponent = component(
                (html) => html`
                    <table>
                        <tbody>
                            <tr class=${'row-class'}>
                                <td data-kind=${'cell-kind'}>x</td>
                            </tr>
                        </tbody>
                    </table>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect(
                $test.querySelector('tr')?.classList.contains('row-class'),
                'tr attribute slot resolved'
            ).to.be.true;
            expect(
                $test.querySelector('td')?.getAttribute('data-kind'),
                'td attribute slot resolved'
            ).to.equal('cell-kind');
        });
    });
});
