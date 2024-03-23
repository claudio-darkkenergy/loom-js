import { expect } from '@esm-bundle/chai';
import { runSetup } from '../../support/run-setup';
import { component } from '../../../src';
import type {
    LifeCycleHookProps,
    TemplateRoot,
    TemplateRootArray
} from '../../../src/types';

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

                        return html`<div class=${className}></div>`;
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

                        return html`<>
                            <header></header>
                            <main></main>
                            <footer></footer>
                        </>`;
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
                            (fragmentRoot as TemplateRootArray)[0].parentElement
                        ).to.be.null;
                        expect(fragmentRoot).to.have.lengthOf(7);
                        expect(Array.isArray(fragmentRoot)).to.be.true;
                    }, 0);

                    return;
                }

                expect(
                    (fragmentRoot as TemplateRootArray)[0].parentElement
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
};
