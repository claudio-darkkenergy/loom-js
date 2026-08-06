import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { getContextForValue } from '../../src/lib/context/helpers';
import { runSetup } from '../support/run-setup';

// A minimal keyed component: renders a `<div>` tagged with its color so tests
// can locate it & compare element identity across updates.
const Box = component<{ color?: string }>(
    (html, { color }) => html`
        <div data-color=${color} style="background-color: ${color}"></div>
    `
);

// Probe pair for `openspec/changes/add-template-component-syntax` task 1.2:
// `NestedChild` stands in for a transform-synthesized children component —
// module-level, stable identity, no `key` of its own — interpolated in a
// template slot of a keyed item, which is exactly what the transform emits.
const NestedChild = component<{ color?: string }>(
    (html, { color }) => html`
        <em data-child=${color}></em>
    `
);
const KeyedItem = component<{ color?: string }>(
    (html, { children, color }) => html`
        <div data-color=${color}>${children}</div>
    `
);

const boxes = ($root: HTMLElement) =>
    Array.from($root.querySelectorAll<HTMLElement>('[data-color]'));
const boxByColor = ($root: HTMLElement, color: string) =>
    boxes($root).find((el) => el.getAttribute('data-color') === color);

describe('activity (array values)', () => {
    describe('change detection', () => {
        it('does not re-run effects when the array content is unchanged (deep)', async () => {
            const spy = sinon.fake(({ value: colors }: { value: string[] }) =>
                colors.map((color) => Box({ key: color, color }))
            );
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>${colors.effect(spy)}</main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            expect(spy.callCount, 'initial render').to.equal(1);

            // Same content (new reference) — must NOT re-run.
            colors.update(['red', 'green', 'blue']);
            expect(spy.callCount, 'same content').to.equal(1);

            // Changed content — must re-run.
            colors.update(['blue', 'red', 'green']);
            expect(spy.callCount, 'reordered content').to.equal(2);
        });

        it('re-runs when forced even if content is unchanged', async () => {
            const spy = sinon.fake(({ value: colors }: { value: string[] }) =>
                colors.map((color) => Box({ key: color, color }))
            );
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>${colors.effect(spy)}</main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            expect(spy.callCount).to.equal(1);

            colors.update(colors.value(), true);
            expect(spy.callCount).to.equal(2);
        });
    });

    describe('value() reference isolation', () => {
        it('does not expose the internal array by reference', () => {
            const colors = activity(['a', 'b', 'c'], { deep: true });
            const snapshot = colors.value();

            snapshot.push('d');

            expect(colors.value()).to.have.length(3);
            expect(colors.value()).to.not.equal(snapshot);
        });
    });

    describe('keyed reconciliation', () => {
        it('reuses each keyed item DOM node across a reorder', async () => {
            let $test: HTMLElement;
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) => Box({ key: color, color }))
                        )}
                    </main>
                `
            );

            $test = await runSetup({ containerProps: { TestComponent } });
            const redBefore = boxByColor($test, 'red');
            const blueBefore = boxByColor($test, 'blue');
            expect(redBefore, 'red rendered').to.exist;
            expect(blueBefore, 'blue rendered').to.exist;

            colors.update(['blue', 'red', 'green']);

            const redAfter = boxByColor($test, 'red');
            const blueAfter = boxByColor($test, 'blue');

            // Same element instances — the node moved with its key, not repainted.
            expect(redAfter, 'red node reused').to.equal(redBefore);
            expect(blueAfter, 'blue node reused').to.equal(blueBefore);
        });

        it('reuses keyed nodes across a full reversal', async () => {
            const colors = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) => Box({ key: color, color }))
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const before = Object.fromEntries(
                boxes($test).map((el) => [el.getAttribute('data-color'), el])
            );

            colors.update(['c', 'b', 'a']); // reversal

            const after = Object.fromEntries(
                boxes($test).map((el) => [el.getAttribute('data-color'), el])
            );
            expect(after['a'], 'a reused').to.equal(before['a']);
            expect(after['c'], 'c reused').to.equal(before['c']);
        });

        it('reuses numeric-keyed nodes across a reorder', async () => {
            const nums = activity([1, 2, 3], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${nums.effect(({ value: ns }) =>
                            ns.map((n) => Box({ key: n, color: String(n) }))
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const oneBefore = boxByColor($test, '1');
            const threeBefore = boxByColor($test, '3');

            nums.update([3, 2, 1]);

            expect(boxByColor($test, '1'), '1 reused').to.equal(oneBefore);
            expect(boxByColor($test, '3'), '3 reused').to.equal(threeBefore);
        });

        it('keeps a numeric key equal to an index from being collapsed', async () => {
            const nums = activity([1, 2, 3], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${nums.effect(({ value: ns }) =>
                            ns.map((n) => Box({ key: n, color: String(n) }))
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });

            // Two reorders — the 2nd proves the childCtx survived the 1st pass.
            nums.update([3, 2, 1]);
            const afterFirst = Object.fromEntries(
                boxes($test).map((el) => [el.getAttribute('data-color'), el])
            );
            nums.update([1, 2, 3]);
            const afterSecond = Object.fromEntries(
                boxes($test).map((el) => [el.getAttribute('data-color'), el])
            );

            expect(afterSecond['1'], '1 still reused').to.equal(
                afterFirst['1']
            );
            expect(afterSecond['2'], '2 still reused').to.equal(
                afterFirst['2']
            );
            expect(afterSecond['3'], '3 still reused').to.equal(
                afterFirst['3']
            );
        });
    });

    describe('keyed reconciliation with nested children (task 1.2 probe)', () => {
        it('should move an unkeyed nested child with its keyed parent across a reorder', async () => {
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) =>
                                KeyedItem({
                                    children: NestedChild({ color }),
                                    color,
                                    key: color
                                })
                            )
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const childOf = (color: string) =>
                $test.querySelector(`[data-color="${color}"] > [data-child]`);
            const redChildBefore = childOf('red');
            const blueChildBefore = childOf('blue');
            expect(redChildBefore, 'red child rendered').to.exist;
            expect(blueChildBefore, 'blue child rendered').to.exist;

            colors.update(['blue', 'red', 'green']);

            // If children fell to the index keyspace while their parents
            // reconcile by key, these nodes would be recreated or would land
            // under the wrong parent after the reorder.
            expect(childOf('red'), 'red child reused').to.equal(redChildBefore);
            expect(childOf('blue'), 'blue child reused').to.equal(
                blueChildBefore
            );
            expect(
                childOf('red')?.getAttribute('data-child'),
                'red child content intact'
            ).to.equal('red');
        });

        it('should keep nested children with their keyed parents across repeated reorders', async () => {
            const colors = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) =>
                                KeyedItem({
                                    children: NestedChild({ color }),
                                    color,
                                    key: color
                                })
                            )
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const childOf = (color: string) =>
                $test.querySelector(`[data-color="${color}"] > [data-child]`);

            colors.update(['c', 'b', 'a']);
            const aAfterFirst = childOf('a');
            const cAfterFirst = childOf('c');
            expect(aAfterFirst, 'a child present after reversal').to.exist;

            colors.update(['a', 'b', 'c']);

            // The 2nd reorder proves the child ctx survived the 1st pass.
            expect(childOf('a'), 'a child still reused').to.equal(aAfterFirst);
            expect(childOf('c'), 'c child still reused').to.equal(cAfterFirst);
        });
    });

    describe('single reconciliation per update', () => {
        it('resolves each array item exactly once per update', async () => {
            const itemSpy = sinon.spy();
            const SpyBox = component<{ color?: string }>((html, { color }) => {
                itemSpy(color);
                return html`
                    <div data-color=${color}></div>
                `;
            });
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) => SpyBox({ key: color, color }))
                        )}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            expect(itemSpy.callCount, 'initial render').to.equal(3);

            itemSpy.resetHistory();
            colors.update(['blue', 'red', 'green']);

            expect(itemSpy.callCount, 'one resolve per item').to.equal(3);
        });
    });

    describe('getContextForValue (protective name check)', () => {
        it('reads the context/key of a component context function', () => {
            const snapshot = getContextForValue(
                Box({ key: 'k', color: 'red' })
            );

            expect((snapshot as { key?: string }).key).to.equal('k');
        });

        it('does not invoke an activityContextFunction (would leak a subscription)', () => {
            const { effect } = activity(0, { deep: false });
            const activityFn = effect(({ value }) => value);
            const renderSpy = sinon.spy();
            const activitySpy = sinon.spy(
                ({ value }: { value: number }) => (renderSpy(), value)
            );
            const observed = effect(activitySpy);

            // Snapshotting an activity effect must NOT execute it.
            expect(getContextForValue(activityFn)).to.deep.equal({});
            getContextForValue(observed);
            expect(renderSpy.called, 'effect not invoked by snapshot').to.be
                .false;
        });
    });
});
