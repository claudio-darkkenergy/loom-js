import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { createRoutes, route, watchRoute } from '../../src';
import { activity } from '../../src/activity';
import { reactive, reactiveEffect } from '../../src/lib/reactive';

// Specs for the `reactive-unsubscribe` capability (`add-reactive-unsubscribe`
// design D1–D5): reactive effects and activity watchers are disposable —
// disposal permanently stops re-runs, is idempotent, and is safe mid-trigger.

describe('reactive unsubscribe', () => {
    describe('reactiveEffect disposal', () => {
        it('should return a dispose function', () => {
            const proxy = reactive({ value: 0 }) as { value: number };
            const dispose = reactiveEffect(({ value }) => value, proxy);

            expect(dispose).to.be.a('function');
        });

        it('should stop re-running a disposed effect', () => {
            const proxy = reactive({ value: 0 }) as { value: number };
            const update = sinon.fake(({ value }: { value: number }) => value);
            const dispose = reactiveEffect(update, proxy);

            // Registration runs the effect once.
            expect(update.callCount).to.equal(1);

            proxy.value = 1;
            expect(update.callCount).to.equal(2);

            dispose();
            proxy.value = 2;
            proxy.value = 3;
            expect(update.callCount).to.equal(2);
        });

        it('should remove the effect from every tracked property', () => {
            const proxy = reactive({ left: 0, right: 0 }) as {
                left: number;
                right: number;
            };
            const update = sinon.fake(
                ({ left, right }: { left: number; right: number }) =>
                    left + right
            );
            const dispose = reactiveEffect(update, proxy);

            proxy.left = 1;
            proxy.right = 1;
            expect(update.callCount).to.equal(3);

            dispose();
            proxy.left = 2;
            proxy.right = 2;
            expect(update.callCount).to.equal(3);
        });

        it('should treat double-dispose as a no-op', () => {
            const proxy = reactive({ value: 0 }) as { value: number };
            const update = sinon.fake(({ value }: { value: number }) => value);
            const dispose = reactiveEffect(update, proxy);

            dispose();
            expect(() => dispose()).not.to.throw();

            proxy.value = 1;
            expect(update.callCount).to.equal(1);
        });

        it('should not run a sibling effect disposed during a trigger pass', () => {
            const proxy = reactive({ value: 0 }) as { value: number };
            const sibling = sinon.fake(({ value }: { value: number }) => value);
            let disposeSibling: () => void;

            // Registered first, so it runs first on each trigger pass and
            // disposes the sibling mid-pass.
            reactiveEffect(({ value }: { value: number }) => {
                if (value === 1) {
                    disposeSibling();
                }

                return value;
            }, proxy);
            disposeSibling = reactiveEffect(sibling, proxy);

            expect(sibling.callCount).to.equal(1);

            // The first effect disposes the sibling during this pass; the
            // sibling must not run for this trigger nor any later one.
            proxy.value = 1;
            proxy.value = 2;
            expect(sibling.callCount).to.equal(1);
        });

        it('should not resurrect an effect that disposes itself mid-run', () => {
            const proxy = reactive({ value: 0 }) as { value: number };
            let disposeSelf: () => void;
            const update = sinon.fake(({ value }: { value: number }) => {
                if (value === 1) {
                    disposeSelf();
                }

                return value;
            });

            disposeSelf = reactiveEffect(update, proxy);

            proxy.value = 1;
            expect(update.callCount).to.equal(2);

            // The self-disposing run re-read `value`, which would re-track the
            // effect if disposal didn't guard against resurrection.
            proxy.value = 2;
            proxy.value = 3;
            expect(update.callCount).to.equal(2);
        });
    });

    describe('activity watch unsubscribers', () => {
        it('should stop invoking an unsubscribed watcher', () => {
            const { update, watch } = activity(0);
            const watcher = sinon.fake();
            const unsubscribe = watch(watcher);

            // Registration fires the watcher once with the current value.
            expect(watcher.callCount).to.equal(1);

            update(1);
            expect(watcher.callCount).to.equal(2);

            unsubscribe();
            update(2);
            expect(watcher.callCount).to.equal(2);
        });

        it('should leave sibling watchers intact when one unsubscribes', () => {
            const { update, watch } = activity(0);
            const unsubscribed = sinon.fake();
            const surviving = sinon.fake();
            const unsubscribe = watch(unsubscribed);

            watch(surviving);
            unsubscribe();

            update(1);
            update(2);

            expect(unsubscribed.callCount).to.equal(1);
            // Initial registration fire plus exactly one call per update.
            expect(surviving.callCount).to.equal(3);
        });
    });

    describe('watchRoute unsubscriber', () => {
        it('should stop invoking an unsubscribed route watcher', () => {
            createRoutes({
                config: {
                    '/': () => Promise.resolve(undefined),
                    '/reactive-unsubscribe-a': () => Promise.resolve(undefined),
                    '/reactive-unsubscribe-b': () => Promise.resolve(undefined)
                }
            });

            const handler = sinon.fake();
            const unsubscribe = watchRoute(handler);
            const initialCallCount = handler.callCount;

            route(null, { href: '/reactive-unsubscribe-a', replace: true });
            expect(handler.callCount).to.equal(initialCallCount + 1);

            expect(unsubscribe).to.be.a('function');
            unsubscribe();

            route(null, { href: '/reactive-unsubscribe-b', replace: true });
            expect(handler.callCount).to.equal(initialCallCount + 1);
        });
    });
});
