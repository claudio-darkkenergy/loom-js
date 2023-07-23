import { expect } from '@esm-bundle/chai';

import { Input } from '../support/components/input';
import {
    WithLifeCycles,
    WithLifeCyclesProps
} from '../support/components/with-life-cycles';
import { WithRefContext } from '../support/components/with-ref-context';
import { runSetup } from '../support/run-setup';
import {
    NodeListFragment,
    NodelessFragment,
    SingleNodeFragment
} from '../support/components/fragments';

describe('component', () => {
    let $test: HTMLElement;
    let $unit: HTMLInputElement | null;
    const testText = 'Testing `component`...';

    before(() => {
        document.body.prepend(document.createElement('main'));
    });

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
            expect($unit).to.be.instanceof(HTMLInputElement);
        });

        it('has the "value" attribute set to the `value` prop', () => {
            expect($unit?.value.trim()).to.equal(testText.trim());
        });
    });

    describe('nodeless fragment', () => {
        let $testDouble: Node;

        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps: {
                        value: testText
                    },
                    TestComponent: NodelessFragment
                }
            });
        });

        beforeEach(() => {
            $testDouble = $test.cloneNode(true);
            $testDouble.textContent = $testDouble.textContent?.trim() || null;
        });

        it('should have no children', () => {
            expect($test.children.length).to.equal(0);
        });

        it('should have one childNode of type `Text`', () => {
            expect($testDouble.childNodes.length).to.equal(1);
            expect($testDouble.childNodes[0]).to.be.instanceof(Text);
        });

        it('`textContent` should match the test value', () => {
            expect($testDouble.textContent).to.equal(testText);
        });
    });

    describe('single node fragment', () => {
        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps: {
                        value: testText
                    },
                    TestComponent: SingleNodeFragment
                }
            });
        });

        it('should contain one `HTMLElement` w/ the correct test value', () => {
            expect($test.children.length).to.equal(1);
            expect($test.children[0]).to.be.instanceof(HTMLDivElement);
            expect($test.children[0].textContent).to.equal(testText);
        });
    });

    describe('node list fragment', () => {
        const testHeadingText = 'Node List Fragment';

        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps: {
                        value: { h1: testHeadingText, p: testText }
                    },
                    TestComponent: NodeListFragment
                }
            });
        });

        it('should contain all children', () => {
            expect($test.children.length).to.equal(2);
            expect($test.children[0]).to.be.instanceof(HTMLHeadingElement);
            expect($test.children[1]).to.be.instanceof(HTMLParagraphElement);
        });

        it('should contain the correct test value w/in each `HTMLElement`', () => {
            expect($test.children[0]?.textContent).to.equal(testHeadingText);
            expect($test.children[1]?.textContent).to.equal(testText);
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
                                            created: (node) =>
                                                console.log(
                                                    'created',
                                                    node?.nodeName
                                                ),
                                            mounted: (node) =>
                                                console.log(
                                                    'mounted',
                                                    node?.nodeName
                                                ),
                                            beforeRender: (node) =>
                                                console.log(
                                                    'rendered',
                                                    node?.nodeName
                                                ),
                                            rendered: (node) =>
                                                console.log(
                                                    'rendered',
                                                    node?.nodeName
                                                ),
                                            unmounted: (node) =>
                                                console.log(
                                                    'unmounted',
                                                    node?.nodeName
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
