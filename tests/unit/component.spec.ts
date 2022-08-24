import { expect } from '@esm-bundle/chai';
import { LifeCyclesProp } from 'tests/types';
import { Input } from '../support/components/input';
import {
    WithLifeCycles,
    WithLifeCyclesProps
} from '../support/components/with-life-cycles';
import { WithRefContext } from '../support/components/with-ref-context';
import { runSetup } from '../support/run-setup';

describe('component', () => {
    let $test: HTMLElement;
    let $unit: HTMLInputElement | null;
    const testText = 'Testing `component`...';

    describe('basic behavior', () => {
        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps: {
                        value: testText
                    },
                    TestComponent: Input
                }
            });

            $unit = $test.querySelector('input');
        });

        it('should be an instanceof `HTMLInputElement`', () => {
            expect($unit).to.be.instanceOf(HTMLInputElement);
        });

        it('has the "value" attribute set to the `value` prop', () => {
            expect($unit?.value.trim()).to.equal(testText.trim());
        });
    });

    describe('advanced behavior', () => {
        // let TestComponent: Component<{ }>;

        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps: {
                        value: {
                            child: (props: WithLifeCyclesProps) =>
                                WithLifeCycles({
                                    ...props,
                                    value: {
                                        lifeCycles: {
                                            onCreated: (node) =>
                                                console.log(
                                                    'created',
                                                    node.nodeName
                                                ),
                                            onMounted: (node) =>
                                                console.log(
                                                    'mounted',
                                                    node.nodeName
                                                ),
                                            onBeforeRender: (node) =>
                                                console.log(
                                                    'rendered',
                                                    node.nodeName
                                                ),
                                            onRendered: (node) =>
                                                console.log(
                                                    'rendered',
                                                    node.nodeName
                                                ),
                                            onUnmounted: (node) =>
                                                console.log(
                                                    'unmounted',
                                                    node.nodeName
                                                )
                                        }
                                    }
                                }),
                            refLifeCycles: {
                                onCreated: (node) =>
                                    console.log('ref created', node.nodeName),
                                onMounted: (node) =>
                                    console.log('ref mounted', node.nodeName),
                                onBeforeRender: (node) =>
                                    console.log('ref rendered', node.nodeName),
                                onRendered: (node) =>
                                    console.log('ref rendered', node.nodeName),
                                onUnmounted: (node) =>
                                    console.log('ref unmounted', node.nodeName)
                            } as LifeCyclesProp
                        }
                    },
                    TestComponent: WithRefContext
                }
            });
        });

        it('', () => {
            //
        });
    });
});
