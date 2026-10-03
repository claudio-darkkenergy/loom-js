import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

const range = (count: number) =>
    Array.from({ length: count }, (_, index) => index);

// A row that reports every template run and every `rendered` life-cycle.
const makeRow = () => {
    const templateRuns = sinon.fake();
    const rendered = sinon.fake();
    // `id` is a reserved prop (the root element's id).
    const Row = component<{ rowId?: number; label?: string }>(
        (html, { rowId, label, onRendered }) => {
            templateRuns(rowId);
            onRendered(() => rendered(rowId));

            return html`
                <li data-row=${rowId}>${label}</li>
            `;
        }
    );

    return { Row, rendered, templateRuns };
};

describe('render skip on equal props', () => {
    describe('unchanged props', () => {
        it('should run only the changed rows on a partial update', async () => {
            const { Row, rendered, templateRuns } = makeRow();
            const rows = activity(
                range(1000).map((id) => ({ id, label: `row ${id}` })),
                { deep: true }
            );
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${rows.effect(({ value }) =>
                            value.map(({ id, label }) =>
                                Row({ key: id, label, rowId: id })
                            )
                        )}
                    </ul>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            expect(templateRuns.callCount, 'initial render').to.equal(1000);

            templateRuns.resetHistory();
            rendered.resetHistory();
            rows.update(
                rows
                    .value()
                    .map((row) =>
                        row.id % 10 === 0
                            ? { ...row, label: `${row.label} !!!` }
                            : row
                    )
            );

            expect(templateRuns.callCount, 'templates run').to.equal(100);
            expect(rendered.callCount, 'onRendered fired').to.equal(100);
            expect(
                $test.querySelector('[data-row="10"]')?.textContent?.trim(),
                'changed row updated'
            ).to.equal('row 10 !!!');
            expect(
                $test.querySelector('[data-row="11"]')?.textContent?.trim(),
                'unchanged row intact'
            ).to.equal('row 11');
        });

        it('should not re-run a child when only its parent re-rendered', async () => {
            const { Row, templateRuns } = makeRow();
            const tick = activity(0);
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${tick.effect(() => Row({ label: 'same', rowId: 1 }))}
                    </ul>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            expect(templateRuns.callCount).to.equal(1);

            tick.update(1);

            expect(templateRuns.callCount, 'child skipped').to.equal(1);
        });
    });

    describe('forced renders', () => {
        it('should re-render when a prop changes', async () => {
            const { Row, rendered, templateRuns } = makeRow();
            const label = activity('one');
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${label.effect(({ value }) => Row({ label: value, rowId: 1 }))}
                    </ul>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            templateRuns.resetHistory();
            rendered.resetHistory();

            label.update('two');

            expect(templateRuns.callCount).to.equal(1);
            expect(rendered.callCount).to.equal(1);
            expect(
                $test.querySelector('[data-row="1"]')?.textContent?.trim()
            ).to.equal('two');
        });

        it('should re-render for a new children array reference', async () => {
            const templateRuns = sinon.fake();
            const Wrap = component((html, { children }) => {
                templateRuns();

                return html`
                    <div data-wrap>${children}</div>
                `;
            });
            const tick = activity(0);
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${tick.effect(() => Wrap({ children: ['a', 'b'] }))}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            expect(templateRuns.callCount).to.equal(1);

            tick.update(1);

            expect(templateRuns.callCount, 'new children reference').to.equal(
                2
            );
        });

        it('should keep a shared children reference skipped', async () => {
            const templateRuns = sinon.fake();
            const Wrap = component((html, { children }) => {
                templateRuns();

                return html`
                    <div data-wrap>${children}</div>
                `;
            });
            const children = ['a', 'b'];
            const tick = activity(0);
            const TestComponent = component(
                (html) => html`
                    <main>${tick.effect(() => Wrap({ children }))}</main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            tick.update(1);

            expect(templateRuns.callCount, 'same children reference').to.equal(
                1
            );
        });

        it('should re-render after a remount', async () => {
            const { Row, templateRuns } = makeRow();
            const show = activity(true);
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${show.effect(({ value }) =>
                            value ? Row({ label: 'same', rowId: 1 }) : 'hidden'
                        )}
                    </ul>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            show.update(false);
            await waitForObserver();
            show.update(true);
            await waitForObserver();

            expect(templateRuns.callCount, 'remount renders').to.equal(2);
            expect($test.querySelector('[data-row="1"]')).to.exist;
        });

        it('should re-render when the template fingerprint changes', async () => {
            const first = makeRow();
            const second = makeRow();
            const which = activity<'first' | 'second'>('first');
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${which.effect(({ value }) =>
                            value === 'first'
                                ? first.Row({ label: 'same', rowId: 1 })
                                : second.Row({ label: 'same', rowId: 1 })
                        )}
                    </ul>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            which.update('second');

            expect(
                second.templateRuns.callCount,
                'other template runs'
            ).to.equal(1);
        });
    });

    describe('own activities', () => {
        it('should keep updating a skipped instance through its own effect', async () => {
            const count = activity(0);
            // `id` is a reserved prop (the root element's id).
            const Counter = component<{ counterId?: number }>(
                (html, { counterId }) => html`
                    <p data-counter=${counterId}>
                        ${count.effect(({ value }) => String(value))}
                    </p>
                `
            );
            const tick = activity(0);
            const TestComponent = component(
                (html) => html`
                    <main>${tick.effect(() => Counter({ counterId: 1 }))}</main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const text = () =>
                $test.querySelector('[data-counter="1"]')?.textContent?.trim();

            tick.update(1);
            count.update(5);

            expect(text()).to.equal('5');
        });
    });
});
