import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { _lifeCycles } from '../../src/lib/context/life-cycles';
import type { LifeCycleHook } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for the `unmount-teardown` capability (`add-unmount-teardown`):
// genuinely detached contexts have their activity-effect subscriptions
// disposed (cascading through children), moved-but-attached components are
// left alone, and torn-down contexts re-subscribe on remount.

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('unmount teardown', () => {
    // Pins the platform assumption behind design D1: a same-batch move
    // arrives as removal + addition records within ONE observer callback.
    describe('MutationObserver move batching (D1 platform assumption)', () => {
        it('delivers a same-batch move as removal and addition in one callback', async () => {
            const host = document.createElement('div');
            const first = document.createElement('span');
            const second = document.createElement('span');
            const batches: MutationRecord[][] = [];
            const observer = new MutationObserver((records) =>
                batches.push(records)
            );

            host.append(first, second);
            document.body.appendChild(host);
            observer.observe(host, { childList: true, subtree: true });

            // Move `second` before `first` — one removal, one insertion.
            host.insertBefore(second, first);
            await waitForObserver();
            observer.disconnect();
            host.remove();

            expect(batches.length).to.equal(1);

            const removed = batches[0]!.flatMap((record) => [
                ...record.removedNodes
            ]);
            const added = batches[0]!.flatMap((record) => [
                ...record.addedNodes
            ]);

            expect(removed).to.include(second);
            expect(added).to.include(second);
        });
    });

    describe('detached contexts stop receiving activity updates', () => {
        it('stops re-running the effect of a removed component', async () => {
            const content = activity('one');
            const renderSpy = sinon.fake(
                ({ value }: { value: string }) => `text: ${value}`
            );
            const TestComponent = component(
                (html) => html`
                    <article data-teardown>
                        ${content.effect(renderSpy)}
                    </article>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $article = $test.querySelector('[data-teardown]');

            expect(renderSpy.callCount).to.equal(1);

            content.update('two');
            expect(renderSpy.callCount).to.equal(2);

            $article?.remove();
            await waitForObserver();

            content.update('three');
            expect(renderSpy.callCount).to.equal(2);
        });

        it('cascades teardown through child contexts', async () => {
            const innerContent = activity('x');
            const innerSpy = sinon.fake(
                ({ value }: { value: string }) => `inner: ${value}`
            );
            const Child = component(
                (html) => html`
                    <p data-child>${innerContent.effect(innerSpy)}</p>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <article data-parent>${Child({})}</article>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $parent = $test.querySelector('[data-parent]');

            expect(innerSpy.callCount).to.equal(1);

            $parent?.remove();
            await waitForObserver();

            innerContent.update('y');
            expect(innerSpy.callCount).to.equal(1);
        });
    });

    describe('moved components are not torn down', () => {
        it('keeps subscriptions and lifecycle registration across an array reorder', async () => {
            const items = activity(['a', 'b']);
            const label = activity('v1');
            const unmountSpy = sinon.fake();
            const labelSpy = sinon.fake(
                ({ value }: { value: string }) => `label: ${value}`
            );
            const Item = component<{ id?: string }>(
                (html, { id, onUnmounted }) => {
                    onUnmounted(unmountSpy);

                    return html`
                        <li data-item=${id}>${label.effect(labelSpy)}</li>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <ul data-list>
                        ${items.effect(({ value: ids }) =>
                            ids.map((id) => Item({ id, key: id }))
                        )}
                    </ul>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            // One label render per item at mount.
            expect(labelSpy.callCount).to.equal(2);

            // Reorder — moves DOM nodes via re-insertion (a move, not a removal).
            items.update(['b', 'a']);
            await waitForObserver();

            expect(unmountSpy.callCount).to.equal(0);

            // Both items keep receiving updates after the move.
            const callsAfterMove = labelSpy.callCount;

            label.update('v2');
            expect(labelSpy.callCount).to.equal(callsAfterMove + 2);

            // A later genuine removal still fires `onUnmounted` and tears down.
            items.update(['b']);
            await waitForObserver();

            expect(unmountSpy.callCount).to.equal(1);

            const callsAfterRemoval = labelSpy.callCount;

            label.update('v3');
            expect(labelSpy.callCount).to.equal(callsAfterRemoval + 1);
        });
    });

    describe('torn-down contexts re-subscribe on remount', () => {
        it('resumes updates exactly once after an effect-driven remount', async () => {
            const show = activity(true);
            const inner = activity('x');
            const innerSpy = sinon.fake(
                ({ value }: { value: string }) => `inner: ${value}`
            );
            const Child = component(
                (html) => html`
                    <p data-child>${inner.effect(innerSpy)}</p>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <article>
                        ${show.effect(({ value: isShown }) =>
                            isShown ? Child({}) : 'hidden'
                        )}
                    </article>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(innerSpy.callCount).to.equal(1);

            // Hide — the child unmounts and is torn down.
            show.update(false);
            await waitForObserver();

            const callsWhileHidden = innerSpy.callCount;

            inner.update('y');
            expect(innerSpy.callCount).to.equal(callsWhileHidden);

            // Show again — the same persistent context re-subscribes once.
            show.update(true);
            await waitForObserver();

            const callsAfterRemount = innerSpy.callCount;

            inner.update('z');
            expect(innerSpy.callCount).to.equal(callsAfterRemount + 1);
        });
    });

    describe('a remount registers fresh life-cycle handlers', () => {
        it('should run the onCreated handlers from the remount render, not the first one', async () => {
            const show = activity(true);
            const createdBy: string[] = [];
            let renderCount = 0;
            const useCreatedLog = (
                onCreated: LifeCycleHook,
                renderNumber: number
            ) => onCreated(() => createdBy.push(`hook-${renderNumber}`));
            const Child = component((html, { onCreated }) => {
                const renderNumber = ++renderCount;

                onCreated(() => createdBy.push(`own-${renderNumber}`));
                useCreatedLog(onCreated, renderNumber);

                return html`
                    <p data-child>child</p>
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <article>
                        ${show.effect(({ value: isShown }) =>
                            isShown ? Child({}) : 'hidden'
                        )}
                    </article>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            show.update(false);
            await waitForObserver();
            show.update(true);
            await waitForObserver();

            expect(createdBy).to.deep.equal([
                'own-1',
                'hook-1',
                'own-2',
                'hook-2'
            ]);
        });

        it('should keep firing a handler given through a ref after a remount', async () => {
            const show = activity(true);
            const refCreatedSpy = sinon.fake();
            const Child = component(
                (html) => html`
                    <p data-child>child</p>
                `
            );
            const TestComponent = component((html, { createRef }) => {
                const childRef = createRef();

                childRef.onCreated(refCreatedSpy);

                return html`
                    <article>
                        ${show.effect(({ value: isShown }) =>
                            isShown ? Child({ ref: childRef }) : 'hidden'
                        )}
                    </article>
                `;
            });

            await runSetup({ containerProps: { TestComponent } });

            expect(refCreatedSpy.callCount).to.equal(1);

            show.update(false);
            await waitForObserver();
            show.update(true);
            await waitForObserver();

            expect(refCreatedSpy.callCount).to.equal(2);
        });

        it('should fire a child onUnmounted when its parent is removed', async () => {
            const childUnmountSpy = sinon.fake();
            const Child = component((html, { onUnmounted }) => {
                onUnmounted(childUnmountSpy);

                return html`
                    <p data-child>child</p>
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <article data-parent>${Child({})}</article>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });

            $test.querySelector('[data-parent]')?.remove();
            await waitForObserver();

            expect(childUnmountSpy.callCount).to.equal(1);
        });
    });
});

describe('unmount scan', () => {
    it('should tear down nested and fragment-rooted components in one removed subtree', async () => {
        const unmounted: string[] = [];
        const Deep = component((html, { onUnmounted }) => {
            onUnmounted(() => unmounted.push('deep'));

            return html`
                <b data-deep>deep</b>
            `;
        });
        // Two top-level nodes — a fragment root whose first node is text.
        const Pair = component((html, { onUnmounted }) => {
            onUnmounted(() => unmounted.push('pair'));

            return html`
                lead
                <i>trail</i>
            `;
        });
        const show = activity(true);
        const TestComponent = component(
            (html) => html`
                <article>
                    ${show.effect(({ value }) =>
                        value
                            ? [
                                  Pair({}),
                                  component(
                                      (html) => html`
                                          <section>
                                              <div>
                                                  <span>${Deep({})}</span>
                                              </div>
                                          </section>
                                      `
                                  )({})
                              ]
                            : 'hidden'
                    )}
                </article>
            `
        );

        await runSetup({ containerProps: { TestComponent } });

        show.update(false);
        await waitForObserver();

        expect(unmounted.sort()).to.deep.equal(['deep', 'pair']);
    });

    it('should find nested and fragment-rooted roots without a collection or walker per node', async () => {
        const events: string[] = [];
        const Deep = component((html, { onMounted, onUnmounted }) => {
            onMounted(() => events.push('deep mounted'));
            onUnmounted(() => events.push('deep unmounted'));

            return html`
                <b>deep</b>
            `;
        });
        // Two top-level nodes — a fragment root whose first node is text.
        const Pair = component((html, { onMounted, onUnmounted }) => {
            onMounted(() => events.push('pair mounted'));
            onUnmounted(() => events.push('pair unmounted'));

            return html`
                lead
                <i>trail</i>
            `;
        });
        const Shell = component(
            (html) => html`
                <section>
                    <div>
                        <span>${Deep({})}</span>
                    </div>
                </section>
            `
        );
        const show = activity(true);
        const TestComponent = component(
            (html) => html`
                <article>
                    ${show.effect(({ value }) =>
                        value ? [Pair({}), Shell({})] : 'hidden'
                    )}
                </article>
            `
        );

        // The first pass parses the templates; the spies watch the second.
        await runSetup({ containerProps: { TestComponent } });
        show.update(false);
        await waitForObserver();
        events.length = 0;

        const byTag = sinon.spy(Element.prototype, 'getElementsByTagName');
        const bySelector = sinon.spy(Element.prototype, 'querySelectorAll');
        const walker = sinon.spy(document, 'createTreeWalker');

        try {
            show.update(true);
            await waitForObserver();
            show.update(false);
            await waitForObserver();

            expect(events.sort()).to.deep.equal([
                'deep mounted',
                'deep unmounted',
                'pair mounted',
                'pair unmounted'
            ]);
            expect(
                byTag.callCount + bySelector.callCount + walker.callCount,
                'no collection or walker'
            ).to.equal(0);
        } finally {
            byTag.restore();
            bySelector.restore();
            walker.restore();
        }
    });

    it('should not scan subtrees while no context is registered', async () => {
        const Host = component(
            (html) => html`
                <article data-scan-host></article>
            `
        );
        const $test = await runSetup({
            containerProps: { TestComponent: Host }
        });
        const $host = $test.querySelector('[data-scan-host]')!;

        // Empty the registry under a live observer, then mutate.
        _lifeCycles.release(document);

        const byTag = sinon.spy(Element.prototype, 'getElementsByTagName');
        const bySelector = sinon.spy(Element.prototype, 'querySelectorAll');
        const walker = sinon.spy(document, 'createTreeWalker');
        const firstElementChild = Object.getOwnPropertyDescriptor(
            Element.prototype,
            'firstElementChild'
        )!;
        const descendantReads = sinon.fake();

        sinon.stub(Element.prototype, 'firstElementChild').get(function (
            this: Element
        ) {
            descendantReads();

            return firstElementChild.get!.call(this);
        });

        try {
            const node = document.createElement('p');

            node.innerHTML = '<b><i>nested</i></b>';
            $host.appendChild(node);
            await waitForObserver();
            node.remove();
            await waitForObserver();

            expect(
                byTag.callCount +
                    bySelector.callCount +
                    walker.callCount +
                    descendantReads.callCount
            ).to.equal(0);
        } finally {
            sinon.restore();
        }
    });
});
