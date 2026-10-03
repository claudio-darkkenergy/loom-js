import { expect } from '@esm-bundle/chai';

import { component } from '../../../src';
import { activity } from '../../../src/activity';
import type {
    ComponentContextPartial,
    LifeCycleHook,
    LifeCycleHookProps,
    TemplateRoot,
    TemplateRootArray
} from '../../../src/types';
import { runSetup } from '../../support/run-setup';
import { countReachableFunctions } from '../../support/utils';

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

export const lifeCyclesSpec = () => {
    let $test: HTMLElement;
    let $unit: HTMLDivElement | null;
    let $container: HTMLDivElement | null;
    const className = 'test-unit';
    let singleRoot: TemplateRoot | undefined;
    let fragmentRoot: TemplateRootArray | undefined;
    const lifeCycles: (keyof LifeCycleHookProps)[] = [
        'onCreated',
        'onBeforeRender',
        'onRendered',
        'onMounted',
        'onUnmounted'
    ];

    lifeCycles.forEach((lifeCycle) => {
        describe(`${lifeCycle}()`, () => {
            it('should be called w/ a root node', async () => {
                const TestComponent = component(
                    (html, { className, [lifeCycle]: lifeCycleHook }) => {
                        lifeCycleHook((root) => {
                            singleRoot = root as TemplateRoot;
                        });

                        return html`
                            <div class=${className}></div>
                        `;
                    }
                );

                $test = await runSetup({
                    containerProps: {
                        className: lifeCycle,
                        componentProps: { className },
                        TestComponent
                    }
                });
                $unit = $test.querySelector(`.${className}`);

                if (lifeCycle === 'onUnmounted') {
                    $unit?.remove();
                    setTimeout(() => {
                        expect(singleRoot).to.equal($unit);
                    }, 0);

                    return;
                }

                expect(singleRoot).to.equal($unit);
            });

            it('should be called w/ fragmented nodes', async () => {
                const TestComponent = component(
                    (html, { [lifeCycle]: lifeCycleHook }) => {
                        lifeCycleHook((root) => {
                            fragmentRoot = root as TemplateRootArray;
                        });

                        return html`
                            <header></header>
                            <main></main>
                            <footer></footer>
                        `;
                    }
                );

                $test = await runSetup({
                    containerProps: {
                        className,
                        TestComponent: TestComponent
                    }
                });
                $container = $test.querySelector(`.${className}`);

                if (lifeCycle === 'onUnmounted' && $container) {
                    $container.innerHTML = '';
                    setTimeout(() => {
                        expect(
                            (fragmentRoot as TemplateRootArray)[0]
                                ?.parentElement
                        ).to.be.null;
                        expect(fragmentRoot).to.have.lengthOf(5);
                        expect(Array.isArray(fragmentRoot)).to.be.true;
                    }, 0);

                    return;
                }

                expect(
                    (fragmentRoot as TemplateRootArray)[0]?.parentElement
                        ?.children
                ).to.have.lengthOf(3);
                expect(Array.isArray(fragmentRoot)).to.be.true;

                (fragmentRoot as TemplateRootArray).forEach(
                    (node: TemplateRoot) =>
                        expect($container?.contains(node)).to.be.true
                );
            });
        });
    });

    // Specs for the `life-cycle-handler-stacking` capability: every setter
    // call in the registering render appends, the list locks after that
    // render, and `ref` handlers run after the component's own.
    describe('handler stacking', () => {
        it('should run a component handler and a hook handler for the same event, in order', async () => {
            const calls: string[] = [];
            const useMountLog = (onMounted: LifeCycleHook) =>
                onMounted(() => calls.push('hook'));
            const TestComponent = component((html, { onMounted }) => {
                onMounted(() => calls.push('component'));
                useMountLog(onMounted);

                return html`
                    <div class=${className}></div>
                `;
            });

            await runSetup({ containerProps: { TestComponent } });

            expect(calls).to.deep.equal(['component', 'hook']);
        });

        it('should run two hook handlers for the same event, in hook call order', async () => {
            const calls: string[] = [];
            const useFirst = (onUnmounted: LifeCycleHook) =>
                onUnmounted(() => calls.push('first'));
            const useSecond = (onUnmounted: LifeCycleHook) =>
                onUnmounted(() => calls.push('second'));
            const TestComponent = component((html, { onUnmounted }) => {
                useFirst(onUnmounted);
                useSecond(onUnmounted);

                return html`
                    <div class=${className}></div>
                `;
            });

            $test = await runSetup({ containerProps: { TestComponent } });
            $test.querySelector(`.${className}`)?.remove();
            await waitForObserver();

            expect(calls).to.deep.equal(['first', 'second']);
        });

        it('should ignore registrations made by a re-render', async () => {
            const tick = activity(0);
            const calls: string[] = [];
            let renderCount = 0;
            // `tick` travels as a prop: equal props would skip the render.
            const Child = component<{ tick?: number }>(
                (html, { onRendered }) => {
                    renderCount += 1;
                    onRendered(() => calls.push(`render-${renderCount}`));

                    return html`
                        <p>child</p>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <div class=${className}>
                        ${tick.effect(({ value }) => Child({ tick: value }))}
                    </div>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(renderCount).to.equal(1);

            tick.update(1);

            expect(renderCount).to.equal(2);
            // The first render's handler runs on every render; the second
            // render's registration never does.
            expect(calls).to.deep.equal(['render-1', 'render-2']);
        });

        it('should honor an event first registered on a later render', async () => {
            const tick = activity(0);
            const calls: number[] = [];
            let renderCount = 0;
            const Child = component<{ tick?: number }>(
                (html, { onRendered }) => {
                    renderCount += 1;
                    renderCount > 1 &&
                        onRendered(() => calls.push(renderCount));

                    return html`
                        <p>child</p>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <div class=${className}>
                        ${tick.effect(({ value }) => Child({ tick: value }))}
                    </div>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(calls).to.deep.equal([]);

            tick.update(1);

            expect(calls).to.deep.equal([2]);

            tick.update(2);

            expect(calls).to.deep.equal([2, 3]);
        });

        it('should run a child handler and then the parent-ref handler for the same event', async () => {
            const calls: string[] = [];
            const Child = component((html, { onMounted }) => {
                onMounted(() => calls.push('child'));

                return html`
                    <p>child</p>
                `;
            });
            const TestComponent = component((html, { createRef }) => {
                const childRef = createRef();

                childRef.onMounted(() => calls.push('ref'));

                return html`
                    <div class=${className}>${Child({ ref: childRef })}</div>
                `;
            });

            await runSetup({ containerProps: { TestComponent } });

            expect(calls).to.deep.equal(['child', 'ref']);
        });

        it('should hold a handler list only for the events a component registered', () => {
            const TestComponent = component((html, { onMounted }) => {
                onMounted(() => {});

                return html`
                    <div class=${className}></div>
                `;
            });
            const ctx: ComponentContextPartial = {};

            TestComponent()(ctx);

            expect(ctx.mounted?.length, 'mounted list').to.equal(1);
            expect(ctx.created, 'created').to.be.undefined;
            expect(ctx.beforeRender, 'beforeRender').to.be.undefined;
            expect(ctx.rendered, 'rendered').to.be.undefined;
            expect(ctx.unmounted, 'unmounted').to.be.undefined;
        });

        it('should retain no hook function on a context whose render captures none', () => {
            const TestComponent = component(
                (html) => html`
                    <div class=${className}></div>
                `
            );
            const ctx: ComponentContextPartial = {};

            TestComponent()(ctx);

            // `fingerPrint`, the `node` getter and the bound template tag.
            expect(countReachableFunctions(ctx)).to.equal(3);
        });
    });
};
