import { expect } from '@esm-bundle/chai';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// Specs for `fix-fragment-array-reconciliation`: a fragment-rooted value
// (named-slot region or `<>` fragment-template component) passed as an item
// of a children array must render its nodes as a managed group instead of
// stringifying to `"[object Text],[object HTMLDivElement]"`.

// Generic children host — the array under test lands in its `${children}`.
const Wrap = component(
    (html, { children }) => html`
        <div data-wrap>${children}</div>
    `
);

// Single-element item for mixed arrays and kind changes.
const Box = component<{ color?: string }>(
    (html, { color }) => html`
        <div data-color=${color}></div>
    `
);

// Fragment-template component — the `<>` prefix gives it an array root, so
// it is a fragment-rooted children-array item when keyed into a list.
const Pair = component<{ label?: string }>(
    (html, { label }) => html`
        <>
        <dt data-dt=${label}>${label}</dt>
        <dd data-dd=${label}>d</dd>
    `
);

// Non-whitespace child nodes, in DOM order — group contiguity assertions
// ignore the whitespace text nodes fragment templates carry.
const contentNodes = ($parent: Element | null) =>
    Array.from($parent?.childNodes ?? []).filter(
        (node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()
    );
const tagOf = (node: Node) =>
    node.nodeType === Node.TEXT_NODE
        ? `#${node.textContent?.trim()}`
        : node.nodeName;

describe('fragment-rooted children-array items', () => {
    describe('rendering (no stringification)', () => {
        it('renders every node of a region passed as a children-array item', async () => {
            const Grid = component(
                (html, { slots }) => html`
                    <main data-grid>
                        ${Wrap({ children: [slots?.a, slots?.b] })}
                    </main>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <div>
                        <${Grid}>
                            <i slot="a">one</i>
                            <em slot="a">two</em>
                            <b slot="b">three</b>
                        </>
                    </div>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $wrap = $test.querySelector('[data-wrap]');

            expect(
                Array.from($wrap?.querySelectorAll('i, em, b') ?? []).map(
                    (el) => el.textContent
                ),
                'all region nodes rendered, in order'
            ).to.deep.equal(['one', 'two', 'three']);
            expect($wrap?.textContent, 'no stringified nodes').to.not.contain(
                '[object'
            );
        });

        it('renders an array item equivalently to direct interpolation', async () => {
            const DirectForm = component(
                (html, { slots }) => html`
                    <main>${Wrap({ children: slots?.a })}</main>
                `
            );
            const ArrayForm = component(
                (html, { slots }) => html`
                    <main>${Wrap({ children: [slots?.a] })}</main>
                `
            );
            const host = (Form: typeof DirectForm) =>
                component(
                    (html) => html`
                        <div>
                            <${Form}>
                                <i slot="a">one</i>
                                <em slot="a">two</em>
                            </>
                        </div>
                    `
                );

            const $direct = await runSetup({
                containerProps: { TestComponent: host(DirectForm) }
            });
            const $viaArray = await runSetup({
                containerProps: { TestComponent: host(ArrayForm) }
            });
            const normalized = ($root: HTMLElement) =>
                $root
                    .querySelector('[data-wrap]')
                    ?.innerHTML.replace(/\s+/g, '');

            expect(normalized($viaArray), 'same rendered content').to.equal(
                normalized($direct)
            );
        });
    });

    describe('group reconciliation', () => {
        it('moves a whole keyed fragment group on reorder, preserving node identity', async () => {
            const order = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main data-list>
                        ${order.effect(({ value: labels }) =>
                            labels.map((label) => Pair({ key: label, label }))
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $list = $test.querySelector('[data-list]');
            const dtOf = (label: string) =>
                $test.querySelector(`[data-dt="${label}"]`);
            const dtABefore = dtOf('a');
            const dtCBefore = dtOf('c');
            expect(dtABefore, 'pair "a" rendered').to.exist;

            order.update(['c', 'b', 'a']);

            expect(
                contentNodes($list).map(tagOf),
                'each group contiguous, groups in the new order'
            ).to.deep.equal(['DT', 'DD', 'DT', 'DD', 'DT', 'DD']);
            expect(
                Array.from($list?.querySelectorAll('dt') ?? []).map((el) =>
                    el.getAttribute('data-dt')
                ),
                'group order follows the reorder'
            ).to.deep.equal(['c', 'b', 'a']);
            expect(dtOf('a'), 'moved node reused, not repainted').to.equal(
                dtABefore
            );
            expect(dtOf('c'), 'moved node reused, not repainted').to.equal(
                dtCBefore
            );
        });

        it('removes every node of a group dropped by truncation', async () => {
            const order = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main data-list>
                        ${order.effect(({ value: labels }) =>
                            labels.map((label) => Pair({ key: label, label }))
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            expect($test.querySelectorAll('dt').length).to.equal(3);

            order.update(['a']);

            expect(
                $test.querySelectorAll('dt').length,
                'dropped groups fully removed'
            ).to.equal(1);
            expect(
                $test.querySelectorAll('dd').length,
                'no orphaned group nodes'
            ).to.equal(1);
            expect(
                $test.querySelector('dt')?.getAttribute('data-dt'),
                'surviving group is the right one'
            ).to.equal('a');
        });

        it('keeps exact child order in a mixed single/text/fragment array', async () => {
            const Mixed = component(
                (html, { slots }) => html`
                    <main>
                        ${Wrap({
                            children: [
                                Box({ color: 'first' }),
                                'plain',
                                slots?.a
                            ]
                        })}
                    </main>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <div>
                        <${Mixed}>
                            <i slot="a">one</i>
                            <em slot="a">two</em>
                        </>
                    </div>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect(
                contentNodes($test.querySelector('[data-wrap]')).map(tagOf),
                'array item order preserved, fragment group contiguous'
            ).to.deep.equal(['DIV', '#plain', 'I', 'EM']);
        });

        it('fully replaces the rendering when an item changes kind', async () => {
            const kind = activity<'fragment' | 'element' | 'text'>('fragment');
            const KindHost = component(
                (html, { slots }) => html`
                    <main data-kind>
                        ${kind.effect(({ value }) =>
                            Wrap({
                                children: [
                                    value === 'fragment'
                                        ? slots?.x
                                        : value === 'element'
                                          ? Box({ color: 'solo' })
                                          : 'plain-text'
                                ]
                            })
                        )}
                    </main>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <div>
                        <${KindHost}>
                            <i slot="x">frag-one</i>
                            <em slot="x">frag-two</em>
                        </>
                    </div>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $wrap = () => $test.querySelector('[data-wrap]');
            expect($wrap()?.querySelectorAll('i, em').length).to.equal(2);

            kind.update('element');
            expect(
                $wrap()?.querySelectorAll('i, em').length,
                'fragment group fully removed'
            ).to.equal(0);
            expect($wrap()?.querySelector('[data-color="solo"]')).to.exist;

            kind.update('text');
            expect(
                $wrap()?.querySelector('[data-color="solo"]'),
                'element removed'
            ).to.equal(null);
            expect($wrap()?.textContent).to.contain('plain-text');

            kind.update('fragment');
            expect(
                $wrap()?.querySelectorAll('i, em').length,
                'fragment group re-rendered'
            ).to.equal(2);
            expect($wrap()?.textContent, 'text removed').to.not.contain(
                'plain-text'
            );
        });
    });

    describe('empty groups', () => {
        it('holds the item position while empty and re-fills in place', async () => {
            const gapCount = activity(0);
            const makeSpans = (count: number) =>
                Array.from({ length: count }, (_, spanIndex) => {
                    const span = document.createElement('span');
                    span.setAttribute('data-gap', String(spanIndex));
                    return span;
                });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${gapCount.effect(({ value: count }) =>
                            Wrap({
                                children: [
                                    Box({ color: 'left' }),
                                    () => makeSpans(count),
                                    Box({ color: 'right' })
                                ]
                            })
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $wrap = $test.querySelector('[data-wrap]');

            expect(
                $wrap?.querySelectorAll('[data-gap]').length,
                'empty group renders nothing visible'
            ).to.equal(0);
            expect(
                $wrap?.textContent?.trim(),
                'no stray content while empty'
            ).to.equal('');

            gapCount.update(2);

            expect(
                contentNodes($wrap).map(tagOf),
                'group re-filled between the same siblings'
            ).to.deep.equal(['DIV', 'SPAN', 'SPAN', 'DIV']);
            expect(
                $wrap
                    ?.querySelector('[data-color="left"]')
                    ?.nextElementSibling?.getAttribute('data-gap'),
                'first span directly follows the left sibling'
            ).to.equal('0');
        });
    });
});
