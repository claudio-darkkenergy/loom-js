import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import type { ComponentContextPartial } from '../../src/types';
import { runSetup } from '../support/run-setup';

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
    describe('one updater per dynamic path', () => {
        it('should hold a plain values array and one updater per path', () => {
            const Box = component<{ a?: string; b?: string }>(
                (html, { a, b }) => html`
                    <div data-a=${a} data-b=${b}>${a}</div>
                `
            );
            const ctx: ComponentContextPartial = {};

            Box({ a: 'x', b: 'y' })(ctx);

            expect(Array.isArray(ctx.values), 'values is an array').to.be.true;
            expect(ctx.values).to.deep.equal(['x', 'y', 'x']);
            expect(ctx.updaters?.length, 'one updater per path').to.equal(3);
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
