import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
    activity,
    component,
    el,
    lazyImport,
    locationEffect,
    routeEffect
} from '../../src';
import {
    ComponentContextPartial,
    DevtoolsHook,
    activitiesOf,
    childContextsOf,
    describeActivity,
    findOwnerContext,
    getAppRoots,
    instanceOf,
    kindOf,
    nameActivity,
    nodeNameOf,
    setDevtoolsHook
} from '../../src/devtools';
import type { TemplateTagValue } from '../../src/types';
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

    describe('component values', () => {
        it('resolves children, slot and el() values to the instances they rendered', async () => {
            const seen: Record<string, unknown> = {};
            const Card = component<{ list?: TemplateTagValue }>(
                (html, { children, list, slots }) => {
                    Object.assign(seen, {
                        children,
                        list,
                        title: slots?.title
                    });

                    return html`
                        <article>
                            <h2>${slots?.title}</h2>
                            ${children} ${list}
                        </article>
                    `;
                },
                { name: 'Card' }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        <${Card} list=${el('ul')({ children: 'items' })}>
                            <b slot="title">Title</b>
                            <i data-body>body</i>
                        </>
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            const card = ownerOf('[data-body]')!.parent!;

            expect(nodeNameOf(card)).to.equal('Card');
            [
                ['children', 'children'],
                ['title', 'slot:title'],
                ['list', '<ul>']
            ].forEach(([prop, name]) => {
                const instance = instanceOf(seen[prop!], card);

                expect(instance && nodeNameOf(instance), prop).to.equal(name);
                expect(instance?.parent && findOwnerContext(card.root as Node))
                    .to.exist;
            });
        });

        it('resolves a value rendered deeper down, and each item of an array', async () => {
            const received: TemplateTagValue[] = [];
            const Badge = component<{ text: string }>(
                (html, { text }) => html`
                    <b data-badge>${text}</b>
                `,
                { name: 'Badge' }
            );
            const Inner = component(
                (html, { children }) => html`
                    <span>${children}</span>
                `,
                { name: 'Inner' }
            );
            const Outer = component(
                (html, { children }) => {
                    received.push(children as TemplateTagValue);

                    return html`
                        <div data-outer>${Inner({ children })}</div>
                    `;
                },
                { name: 'Outer' }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${Outer({
                            children: [
                                Badge({ key: 'one', text: '1' }),
                                Badge({ key: 'two', text: '2' })
                            ]
                        })}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            const outer = ownerOf('[data-outer]')!;
            const [first, second] = received.at(-1) as TemplateTagValue[];
            const badges = document.querySelectorAll('[data-badge]');

            expect(instanceOf(first, outer)).to.equal(
                findOwnerContext(badges[0]!)
            );
            expect(instanceOf(second, outer)).to.equal(
                findOwnerContext(badges[1]!)
            );
        });

        it('resolves nothing for a value that never rendered', async () => {
            const Unused = component(
                (html) => html`
                    <p>unused</p>
                `
            );
            const Holder = component(
                (html) => html`
                    <p data-holder>holder</p>
                `
            );

            await runSetup({ containerProps: { TestComponent: Holder } });

            const holder = ownerOf('[data-holder]')!;

            expect(instanceOf(Unused(), holder)).to.be.undefined;
            expect(instanceOf('text', holder)).to.be.undefined;
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
                labeled: true,
                name: '⟨tone⟩',
                pending: false,
                value: 'calm'
            });
        });
    });

    describe('activity names', () => {
        it('labels an unlabeled activity and returns it', () => {
            const count = activity(0);

            expect(describeActivity(count).labeled).to.be.false;
            expect(nameActivity(count, 'count')).to.equal(count);
            expect(describeActivity(count)).to.include({
                labeled: true,
                name: '⟨count⟩'
            });
        });

        it('never replaces an explicit label', () => {
            const count = activity(0, { label: 'cartCount' });

            nameActivity(count, 'count');
            expect(describeActivity(count).name).to.equal('⟨cartCount⟩');
        });

        it('ignores values that are not activities', () => {
            const plain = { value: () => 0 };

            expect(nameActivity(plain, 'plain')).to.equal(plain);
        });

        it("labels core's own router and lazy-import activities", async () => {
            const Empty = component(
                (html) => html`
                    <i></i>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <div data-routed>
                        ${locationEffect(() => Empty())}
                        ${routeEffect(() => Empty())}
                    </div>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            const names = activitiesOf(ownerOf('[data-routed]')!).map(
                (found) => describeActivity(found).name
            );

            expect(names).to.deep.equal([
                '⟨router.location⟩',
                '⟨router.route⟩'
            ]);
            expect(
                describeActivity(
                    lazyImport('./pages/home', () => Promise.resolve(0))
                ).name
            ).to.equal('⟨lazyImport(./pages/home)⟩');
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
