import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import type { ComponentContextPartial } from '../../src/types';
import { runSetup } from '../support/run-setup';
import { countReachableFunctions } from '../support/utils';

// Attribute and child-list mutations under `target` since the last read.
const observeMutations = (target: Node) => {
    const observer = new MutationObserver(() => {});

    observer.observe(target, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true
    });

    return () => {
        const records = observer.takeRecords();

        return {
            attributes: records.filter(({ type }) => type === 'attributes')
                .length,
            childList: records.filter(({ type }) => type === 'childList')
                .length,
            characterData: records.filter(
                ({ type }) => type === 'characterData'
            ).length
        };
    };
};

describe('template slot updates', () => {
    describe('one slot per dynamic path', () => {
        it('should hold one slot per path carrying its last value', () => {
            const Box = component<{ a?: string; b?: string }>(
                (html, { a, b }) => html`
                    <div data-a=${a} data-b=${b}>${a}</div>
                `
            );
            const ctx: ComponentContextPartial = {};

            Box({ a: 'x', b: 'y' })(ctx);

            expect(ctx.slots?.map(({ value }) => value)).to.deep.equal([
                'x',
                'y',
                'x'
            ]);
        });

        it('should not grow the functions reachable from a context with the path count', () => {
            const Two = component<{ a?: string }>(
                (html, { a }) => html`
                    <div data-a=${a}>${a}</div>
                `
            );
            const Twelve = component<{ a?: string }>(
                (html, { a }) => html`
                    <div
                        data-a=${a}
                        data-b=${a}
                        data-c=${a}
                        data-d=${a}
                        data-e=${a}
                        data-f=${a}
                    >
                        <i>${a}</i>
                        <i>${a}</i>
                        <i>${a}</i>
                        <i>${a}</i>
                        <i>${a}</i>
                        ${a}
                    </div>
                `
            );
            const twoCtx: ComponentContextPartial = {};
            const twelveCtx: ComponentContextPartial = {};

            Two({ a: 'x' })(twoCtx);
            Twelve({ a: 'x' })(twelveCtx);

            expect(twelveCtx.slots?.length, 'twelve paths').to.equal(12);
            expect(countReachableFunctions(twelveCtx)).to.equal(
                countReachableFunctions(twoCtx)
            );
        });
    });

    describe('text slots', () => {
        it('should write a primitive update into the same text node', async () => {
            const text = activity('one');
            const Box = component<{ text?: string }>(
                (html, { text }) => html`
                    <p data-box>${text}</p>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${text.effect(({ value }) => Box({ text: value }))}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const $box = $test.querySelector('[data-box]')!;
            const textNode = $box.firstChild;
            const read = observeMutations($box);

            text.update('two');

            expect($box.firstChild, 'same text node').to.equal(textNode);
            expect($box.textContent).to.equal('two');
            expect(read()).to.deep.equal({
                attributes: 0,
                childList: 0,
                characterData: 1
            });
        });

        it('should still replace the text node for a node value, then write a fresh one', async () => {
            const element = document.createElement('b');
            const value = activity<string | HTMLElement>('one');
            const Box = component<{ value?: string | HTMLElement }>(
                (html, { value }) => html`
                    <p data-box>${value}</p>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${value.effect(({ value: current }) =>
                            Box({ value: current })
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const $box = $test.querySelector('[data-box]')!;

            value.update(element);

            expect($box.firstChild, 'element placed').to.equal(element);

            value.update('two');

            expect(element.textContent, 'element untouched').to.equal('');
            expect($box.firstChild?.nodeType).to.equal(Node.TEXT_NODE);
            expect($box.textContent).to.equal('two');
        });

        it('should replace the placeholder when an array lands beside sibling nodes', async () => {
            const Item = component<{ label?: string }>(
                (html, { label }) => html`
                    <li>${label}</li>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <ul data-list>
                        <li>first</li>
                        ${[Item({ label: 'a' }), Item({ label: 'b' })]}${[
                            Item({ label: 'c' })
                        ]}
                        <li>last</li>
                    </ul>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const $list = $test.querySelector('[data-list]')!;

            expect(
                Array.from($list.childNodes)
                    .map(({ textContent }) => textContent?.trim())
                    .filter(Boolean)
            ).to.deep.equal(['first', 'a', 'b', 'c', 'last']);
        });
    });

    describe('re-renders apply only changed slots', () => {
        it('should write only the changed slots', async () => {
            const state = activity({ a: 'x', b: 'y', text: 't' });
            const Box = component<{ a?: string; b?: string; text?: string }>(
                (html, { a, b, text }) => html`
                    <div data-box data-a=${a} data-b=${b}>${text}</div>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${state.effect(({ value }) =>
                            Box({ a: value.a, b: value.b, text: value.text })
                        )}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const $box = $test.querySelector('[data-box]')!;
            const read = observeMutations($box);

            state.update({ a: 'x', b: 'z', text: 't' });

            expect(read()).to.deep.equal({
                attributes: 1,
                childList: 0,
                characterData: 0
            });
            expect($box.getAttribute('data-b')).to.equal('z');
        });

        it('should re-apply a context-function slot every render', async () => {
            const childRuns = sinon.fake();
            const Child = component<{ tick?: number }>((html, { tick }) => {
                childRuns(tick);

                return html`
                    <p>${tick}</p>
                `;
            });
            const tick = activity(0);
            const Host = component<{ tick?: number }>(
                (html, { tick }) => html`
                    <section>${Child({ tick })}</section>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${tick.effect(({ value }) => Host({ tick: value }))}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            tick.update(1);

            expect(
                childRuns.callCount,
                'child reconciled on each render'
            ).to.equal(2);
        });

        it('should leave a slot alone when handed the same node', async () => {
            const node = document.createElement('i');
            const tick = activity(0);
            const Host = component<{ tick?: number }>(
                (html, { tick }) => html`
                    <section data-host data-tick=${tick}>${node}</section>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${tick.effect(({ value }) => Host({ tick: value }))}
                    </main>
                `
            );
            const $test = await runSetup({ containerProps: { TestComponent } });
            const read = observeMutations($test.querySelector('[data-host]')!);

            tick.update(1);

            expect(read().childList, 'node slot untouched').to.equal(0);
            expect($test.querySelector('[data-host] > i')).to.equal(node);
        });
    });
});
