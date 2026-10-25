import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity, component } from '../../src';
import {
    ComponentContextPartial,
    DevtoolsHook,
    activitiesOf,
    childContextsOf,
    describeActivity,
    findOwnerContext,
    getAppRoots,
    kindOf,
    nodeNameOf,
    setDevtoolsHook
} from '../../src/devtools';
import { runSetup } from '../support/run-setup';

// Specs for the `devtools-introspection` capability: the app-root registry,
// the live tree walk, element → owner lookup, activity discovery, and the
// devtools hook's on/off behavior.

interface TreeSnapshot {
    children: TreeSnapshot[];
    key?: number | string;
    kind?: string;
    name: string;
}

const snapshot = (ctx: ComponentContextPartial): TreeSnapshot => ({
    children: childContextsOf(ctx).map(snapshot),
    key: ctx.key,
    kind: kindOf(ctx),
    name: nodeNameOf(ctx)
});

const ownerOf = (selector: string) =>
    findOwnerContext(document.querySelector(selector)!);

describe('devtools introspection', () => {
    afterEach(() => setDevtoolsHook(null));

    describe('app roots', () => {
        it('reports a mounted app and drops it once removed', async () => {
            const Probe = component(
                (html) => html`
                    <p data-root-probe>r</p>
                `
            );

            await runSetup({ containerProps: { TestComponent: Probe } });

            const appCtx = getAppRoots().find((ctx) =>
                (ctx.root as Element).contains(
                    document.querySelector('[data-root-probe]')
                )
            );

            expect(appCtx, 'registered').to.exist;
            (appCtx!.root as Element).remove();
            expect(getAppRoots()).to.not.include(appCtx);
        });
    });

    describe('tree walk', () => {
        const Item = component<{ label: string }>(
            (html, { label }) => html`
                <li data-walk-item>${label}</li>
            `,
            { name: 'Item' }
        );
        const List = component<{ labels: string[] }>(
            (html, { labels }) => html`
                <ul data-walk-list>
                    ${labels.map((label) => Item({ key: label, label }))}
                </ul>
            `,
            { name: 'List' }
        );

        it('reports keyed list items in render order, read after mount', async () => {
            const labels = activity(['a', 'b', 'c'], { label: 'labels' });
            const TestComponent = component(
                (html) => html`
                    <section data-walk>
                        ${labels.effect(({ value }) => List({ labels: value }))}
                    </section>
                `,
                { name: 'Walk' }
            );

            await runSetup({ containerProps: { TestComponent } });
            labels.update(['c', 'a', 'b']);

            const walk = snapshot(ownerOf('[data-walk]')!);
            const boundary = walk.children[0]!;
            const list = boundary.children[0]!;

            expect(walk.name).to.equal('Walk');
            expect(boundary).to.include({ kind: 'effect', name: '⟨labels⟩' });
            expect(list.name).to.equal('List');
            expect(list.children.map(({ key }) => key)).to.deep.equal([
                'c',
                'a',
                'b'
            ]);
            expect(list.children.every(({ name }) => name === 'Item')).to.be
                .true;
        });

        it('drops a replaced subtree', async () => {
            const showFirst = activity(true);
            const First = component(
                (html) => html`
                    <b data-first>1</b>
                `,
                {
                    name: 'First'
                }
            );
            const Second = component(
                (html) => html`
                    <i data-second>2</i>
                `,
                {
                    name: 'Second'
                }
            );
            const TestComponent = component(
                (html) => html`
                    <div data-swap>
                        ${showFirst.effect(({ value }) =>
                            value ? First() : Second()
                        )}
                    </div>
                `
            );

            await runSetup({ containerProps: { TestComponent } });
            showFirst.update(false);

            const [boundary] = snapshot(ownerOf('[data-swap]')!).children;

            expect(boundary!.children.map(({ name }) => name)).to.deep.equal([
                'Second'
            ]);
        });
    });

    describe('element lookup', () => {
        it('resolves the innermost owning component', async () => {
            const Card = component(
                (html) => html`
                    <article><span data-card-span>x</span></article>
                `,
                { name: 'Card' }
            );
            const Cards = component(
                (html) => html`
                    <div data-cards>${Card()}</div>
                `,
                { name: 'Cards' }
            );

            await runSetup({ containerProps: { TestComponent: Cards } });

            const owner = ownerOf('[data-card-span]')!;

            expect(nodeNameOf(owner)).to.equal('Card');
            expect(nodeNameOf(owner.parent!)).to.equal('Cards');
        });

        it('resolves nothing outside every app', () => {
            const outside = document.createElement('div');

            document.body.append(outside);
            expect(findOwnerContext(outside)).to.be.undefined;
            outside.remove();
        });
    });

    describe('activities', () => {
        it('finds an activity used only through bind()', async () => {
            const tone = activity('calm', { label: 'tone' });
            const TestComponent = component(
                (html) => html`
                    <p data-tone=${tone.bind()} data-bound>t</p>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            const [found] = activitiesOf(ownerOf('[data-bound]')!);

            expect(found).to.equal(tone);
            expect(describeActivity(found!)).to.deep.equal({
                name: '⟨tone⟩',
                pending: false,
                value: 'calm'
            });
        });
    });

    describe('hook', () => {
        it('reports renders and activity creation while set', async () => {
            const hook: DevtoolsHook = {
                activityCreated: sinon.spy(),
                rendered: sinon.spy()
            };
            const count = activity(0);
            const Counter = component(
                (html) => html`
                    <p data-counter>${count.effect(({ value }) => value)}</p>
                `,
                { name: 'Counter' }
            );

            await runSetup({ containerProps: { TestComponent: Counter } });
            setDevtoolsHook(hook);
            count.update(1);

            const created = activity('new');
            const renderedSpy = hook.rendered as sinon.SinonSpy;
            const [boundaryCtx, ms] = renderedSpy.lastCall.args;

            expect(kindOf(boundaryCtx)).to.equal('effect');
            expect(ms).to.be.a('number');
            expect((hook.activityCreated as sinon.SinonSpy).calledWith(created))
                .to.be.true;
        });

        it('reports nothing and times nothing while unset', async () => {
            const clock = sinon.spy(globalThis.performance, 'now');
            const count = activity(0);
            const Counter = component(
                (html) => html`
                    <p data-quiet>${count.effect(({ value }) => value)}</p>
                `
            );

            try {
                await runSetup({ containerProps: { TestComponent: Counter } });
                count.update(1);
                expect(clock.called).to.be.false;
            } finally {
                clock.restore();
            }
        });
    });
});
