import { expect } from '@esm-bundle/chai';
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
                                        lifecycles: {
                                            onCreated: (node) =>
                                                console.log(
                                                    'created',
                                                    node.name
                                                ),
                                            onMounted: (node) =>
                                                console.log(
                                                    'mounted',
                                                    node.name
                                                ),
                                            onRendered: (node) =>
                                                console.log(
                                                    'rendered',
                                                    node.name
                                                ),
                                            onUnmounted: (node) =>
                                                console.log(
                                                    'unmounted',
                                                    node.name
                                                )
                                        }
                                    }
                                }),
                            refLifeCycles: {
                                onCreated: (node) =>
                                    console.log('ref created', node.name),
                                onMounted: (node) =>
                                    console.log('ref mounted', node.name),
                                onRendered: (node) =>
                                    console.log('ref rendered', node.name),
                                onUnmounted: (node) =>
                                    console.log('ref unmounted', node.name)
                            }
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
