import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import type { ComponentContextPartial, ContextFunction } from '../../src/types';
import { runSetup } from '../support/run-setup';

const Box = component<{ color?: string }>(
    (html, { color }) => html`
        <div data-color=${color}></div>
    `
);

const boxByColor = ($root: HTMLElement, color: string) =>
    $root.querySelector<HTMLElement>(`[data-color="${color}"]`);

// Wraps a context function so every invocation is recorded, carrying the
// marker and key over so the reconciler treats it as the original.
const recordInvocations = (
    fn: ContextFunction,
    invocations: { dryRun: boolean }[]
): ContextFunction =>
    Object.assign(
        (ctx?: ComponentContextPartial, dryRun = false) => {
            invocations.push({ dryRun });

            return fn(ctx, dryRun);
        },
        { contextFunctionKind: fn.contextFunctionKind, key: fn.key }
    );

// Classifies one reconciliation pass's child-list mutations on `target`: a
// node both removed and added is a move, added only an insertion, removed
// only a removal. `takeRecords` reads the pending records synchronously.
const observeChildList = (target: Node) => {
    const observer = new MutationObserver(() => {});

    observer.observe(target, { childList: true });

    return () => {
        const added = new Set<Node>();
        const removed = new Set<Node>();

        observer.takeRecords().forEach((record) => {
            record.addedNodes.forEach((node) => added.add(node));
            record.removedNodes.forEach((node) => removed.add(node));
        });
        observer.disconnect();

        const moves = [...added].filter((node) => removed.has(node)).length;

        return {
            insertions: added.size - moves,
            moves,
            removals: removed.size - moves
        };
    };
};

const range = (count: number, from = 0) =>
    Array.from({ length: count }, (_, index) => String(from + index));

// Drives a keyed-list effect through a context the test holds, mounted on a
// real anchor so moves are real DOM operations: the returned `ctx.children`
// is the map the reconciler keys items into.
const mountKeyedList = (initial: string[]) => {
    const labels = activity(initial, { deep: true });
    const host = document.createElement('main');
    const anchor = document.createTextNode('');
    const ctx: ComponentContextPartial = { root: anchor };

    host.append(anchor);
    document.body.prepend(host);
    labels.effect(({ value }) =>
        value.map((label) => Box({ key: label, color: label }))
    )(ctx);

    return {
        ctx,
        host,
        teardown: () => host.remove(),
        update: (next: string[]) => labels.update(next)
    };
};

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('keyed-list diffing', () => {
    describe('minimal moves', () => {
        it('should move at most two nodes for a swap', () => {
            const list = mountKeyedList(range(1000));
            const measure = observeChildList(list.host);
            const swapped = range(1000);

            [swapped[1], swapped[998]] = [swapped[998]!, swapped[1]!];
            list.update(swapped);

            expect(measure()).to.deep.equal({
                insertions: 0,
                moves: 2,
                removals: 0
            });
            expect(
                boxByColor(list.host, '998')?.nextElementSibling,
                'order applied'
            ).to.equal(boxByColor(list.host, '2'));
            list.teardown();
        });

        it('should move nothing for a mid-list removal', () => {
            const list = mountKeyedList(range(1000));
            const measure = observeChildList(list.host);

            list.update(range(1000).filter((label) => label !== '500'));

            expect(measure()).to.deep.equal({
                insertions: 0,
                moves: 0,
                removals: 1
            });
            expect(boxByColor(list.host, '500'), 'removed').to.equal(null);
            expect(list.host.children.length).to.equal(999);
            list.teardown();
        });

        it('should insert only the new nodes for an append', () => {
            const list = mountKeyedList(range(1000));
            const measure = observeChildList(list.host);

            list.update(range(2000));

            expect(measure()).to.deep.equal({
                insertions: 1000,
                moves: 0,
                removals: 0
            });
            expect(list.host.children.length).to.equal(2000);
            expect(
                boxByColor(list.host, '999')?.nextElementSibling,
                'appended after the last existing node'
            ).to.equal(boxByColor(list.host, '1000'));
            list.teardown();
        });

        it('should reverse a list without losing a node', () => {
            const list = mountKeyedList(range(5));
            const first = boxByColor(list.host, '0');

            list.update(range(5).reverse());

            expect(
                [...list.host.children].map((el) =>
                    el.getAttribute('data-color')
                )
            ).to.deep.equal(['4', '3', '2', '1', '0']);
            expect(boxByColor(list.host, '0'), 'node reused').to.equal(first);
            list.teardown();
        });
    });

    describe('context release', () => {
        it('should hold exactly one child context per live item after replace-alls', () => {
            const list = mountKeyedList(range(1000));

            list.update(range(1000, 1000));
            list.update(range(1000, 2000));
            list.update(range(1000, 3000));

            expect(list.ctx.children?.size).to.equal(1000);
            expect(list.host.children.length).to.equal(1000);
            list.teardown();
        });

        it('should fire onUnmounted for a removed key', async () => {
            const unmounted: string[] = [];
            const Item = component<{ label?: string }>(
                (html, { label, onUnmounted }) => {
                    onUnmounted(() => unmounted.push(label!));

                    return html`
                        <li data-item=${label}></li>
                    `;
                }
            );
            const labels = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${labels.effect(({ value }) =>
                            value.map((label) => Item({ key: label, label }))
                        )}
                    </ul>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            labels.update(['a', 'c']);
            await waitForObserver();

            expect(unmounted).to.deep.equal(['b']);
        });
    });

    describe('whole-list replacement', () => {
        afterEach(() => sinon.restore());

        it('should clear a list that fills its parent in one call, releasing every context', () => {
            const list = mountKeyedList(range(1000));
            const replaceChildren = sinon.spy(
                Element.prototype,
                'replaceChildren'
            );
            const remove = sinon.spy(Element.prototype, 'remove');

            list.update([]);

            expect(replaceChildren.callCount, 'one replacement').to.equal(1);
            expect(remove.callCount, 'no per-node removal').to.equal(0);
            expect(list.host.children.length).to.equal(0);
            expect(list.ctx.children?.size, 'contexts released').to.equal(0);
            list.teardown();
        });

        it('should run every unmount handler of a cleared list', async () => {
            const unmounted: string[] = [];
            const Item = component<{ label?: string }>(
                (html, { label, onUnmounted }) => {
                    onUnmounted(() => unmounted.push(label!));

                    return html`
                        <li data-item=${label}></li>
                    `;
                }
            );
            const labels = activity(['a', 'b', 'c'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <ul>
                        ${labels.effect(({ value }) =>
                            value.map((label) => Item({ key: label, label }))
                        )}
                    </ul>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            labels.update([]);
            await waitForObserver();

            expect(unmounted).to.deep.equal(['a', 'b', 'c']);
        });

        it('should replace every key of a list that fills its parent in one call', () => {
            const list = mountKeyedList(range(1000));
            const replaceChildren = sinon.spy(
                Element.prototype,
                'replaceChildren'
            );
            const insertBefore = sinon.spy(Node.prototype, 'insertBefore');
            const remove = sinon.spy(Element.prototype, 'remove');

            list.update(range(1000, 1000));

            expect(replaceChildren.callCount, 'one replacement').to.equal(1);
            expect(insertBefore.callCount, 'no per-node insertion').to.equal(0);
            expect(remove.callCount, 'no per-node removal').to.equal(0);
            expect(list.host.children.length).to.equal(1000);
            expect(
                boxByColor(list.host, '1999'),
                'new keys rendered'
            ).to.not.equal(null);
            expect(list.ctx.children?.size, 'old contexts released').to.equal(
                1000
            );
            list.teardown();
        });

        it('should append 1 000 items with one insertion', () => {
            const list = mountKeyedList(range(1000));
            const insertBefore = sinon.spy(Node.prototype, 'insertBefore');
            const replaceChildren = sinon.spy(
                Element.prototype,
                'replaceChildren'
            );

            list.update(range(2000));

            expect(insertBefore.callCount, 'one insertion').to.equal(1);
            expect(replaceChildren.callCount, 'no replacement').to.equal(0);
            expect(list.host.children.length).to.equal(2000);
            expect(
                boxByColor(list.host, '999')?.nextElementSibling,
                'appended in order'
            ).to.equal(boxByColor(list.host, '1000'));
            list.teardown();
        });

        it('should keep the per-item path when the parent holds other nodes', () => {
            const list = mountKeyedList(range(3));
            const footer = document.createElement('footer');

            list.host.append(footer);

            const replaceChildren = sinon.spy(
                Element.prototype,
                'replaceChildren'
            );

            list.update(range(3, 3));

            expect(replaceChildren.callCount, 'no replacement').to.equal(0);
            expect(list.host.lastElementChild, 'footer kept').to.equal(footer);
            expect(
                [...list.host.children].map((el) =>
                    el.getAttribute('data-color')
                )
            ).to.deep.equal(['3', '4', '5', null]);
            list.teardown();
        });
    });

    describe('key read without rendering', () => {
        it('should expose the key on the context function', () => {
            expect(Box({ key: 'k', color: 'red' }).key).to.equal('k');
            expect(Box({ key: 7, color: 'red' }).key).to.equal(7);
            expect(Box({ color: 'red' }).key).to.equal(undefined);
        });

        it('should never invoke an item in dry-run mode and still key by `key`', async () => {
            const invocations: { dryRun: boolean }[] = [];
            const colors = activity(['red', 'green', 'blue'], { deep: true });
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${colors.effect(({ value: cs }) =>
                            cs.map((color) =>
                                recordInvocations(
                                    Box({ key: color, color }),
                                    invocations
                                )
                            )
                        )}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const redBefore = boxByColor($test, 'red');

            colors.update(['blue', 'red', 'green']);

            expect(
                invocations.filter(({ dryRun }) => dryRun),
                'no dry-run invocations'
            ).to.have.length(0);
            expect(
                invocations.length,
                'one live invocation per item per pass'
            ).to.equal(6);
            expect(boxByColor($test, 'red'), 'keyed node reused').to.equal(
                redBefore
            );
        });
    });
});
