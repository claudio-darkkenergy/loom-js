import { component } from '../../src';
import { activity } from '../../src/activity';
import { getContextForValue } from '../../src/lib/context/helpers';
import { runSetup } from '../support/run-setup';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

// A minimal keyed component: renders a `<div>` tagged with its color so tests
// can locate it & compare element identity across updates.
const Box = component<{ color?: string }>(
    (html, { color }) => html`
        <div data-color=${color} style="background-color: ${color}"></div>
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

        // KNOWN LIMITATION (follow-up): numeric keys collide with the index-based
        // fallback keyspace. The outer `${...}` interpolation re-reconciles the
        // effect's resolved elements (no keys → index fallback) into the same
        // `children` map, and `appendChildContext` deletes the childCtx stored
        // under a numeric user key that equals an index. String/stable keys are
        // unaffected. Fixing this requires resolving the double-reconciliation
        // (findings #3/#4) — tracked as a separate change.
        it.skip('reuses numeric-keyed nodes across a reorder (follow-up)', async () => {
            const nums = activity([1, 2, 3], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${nums.effect(({ value: ns }) =>
                            ns.map((n) =>
                                // Numeric keys are intentionally out-of-contract:
                                // the public `key` prop is typed `string` today, so
                                // this is a type error until the follow-up
                                // (fix-array-double-reconciliation) widens the key type.
                                // @ts-expect-error numeric key not yet in the public `key` type
                                Box({ key: n, color: String(n) })
                            )
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const oneBefore = boxByColor($test, '1');

            nums.update([3, 2, 1]);

            expect(boxByColor($test, '1')).to.equal(oneBefore);
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
