import { expect } from '@esm-bundle/chai';

import { Input } from '../support/components/input';
import { runSetup } from '../support/run-setup';
import {
    NodeListFragment,
    SingleNodeFragment
} from '../support/components/fragments';
import type { ContainerProps } from '../support/components/container';
import { nodeGetterSpec } from './component/node-getter';
import { lifeCyclesSpec } from './component/life-cycles';
import { createRefSpec } from './component/create-ref';
import { contextRefsSpec } from './component/context-refs';

describe('component', () => {
    let $test: HTMLElement;
    let $container: HTMLDivElement | null;
    let $unit: HTMLInputElement | null;
    const testText = 'Testing `component`...';

    before(() => {
        document.body.prepend(document.createElement('main'));
    });

    describe('basic behavior', () => {
        before(async () => {
            $test = await runSetup({
                appInitProps: { root: document.querySelector('main') },
                containerProps: {
                    componentProps: {
                        className: 'component',
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
            expect(($unit as HTMLInputElement | null)?.value.trim()).to.equal(
                testText.trim()
            );
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
            $container = $test.children[0] as HTMLDivElement;
        });

        it('should contain one `HTMLElement` w/ the correct test value', () => {
            expect($test.children.length).to.equal(1);
            expect($container).to.be.instanceof(HTMLDivElement);
            expect($container?.textContent?.trim()).to.equal(testText);
        });

        it('should have one childNode of type `Text`', () => {
            expect($test.childNodes.length).to.equal(1);
            expect($container?.childNodes[0]).to.be.instanceof(Text);
        });

        it('`textContent` should match the test value', () => {
            expect($container?.textContent?.trim()).to.equal(testText);
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
            $container = $test.children[0] as HTMLDivElement;
        });

        it('should contain all children', () => {
            expect($container?.children.length).to.equal(2);
            expect($container?.children[0]).to.be.instanceof(
                HTMLHeadingElement
            );
            expect($container?.children[1]).to.be.instanceof(
                HTMLParagraphElement
            );
        });

        it('should contain the correct test value w/in each `HTMLElement`', () => {
            expect($container?.children[0]?.textContent).to.equal(
                testHeadingText
            );
            expect($container?.children[1]?.textContent).to.equal(testText);
        });
    });

    describe('component props', () => {
        const backgroundColor = 'red';
        const componentProps: ContainerProps['componentProps'] = {
            className: 'classname-prop',
            disabled: true,
            style: `background-color: ${backgroundColor}`,
            value: 'value-prop'
        };

        before(async () => {
            $test = await runSetup({
                containerProps: {
                    componentProps,
                    TestComponent: Input
                }
            });
            $unit = $test.querySelector('input');
        });

        it('should receive optional props when passed', () => {
            expect($unit?.className.includes(String(componentProps.className)));
            expect($unit?.style.backgroundColor).to.equal(backgroundColor);
        });

        it('should receive props when passed', () => {
            expect($unit).to.have.property('disabled', true);
            expect($unit?.value).to.equal(componentProps.value);
        });
    });

    describe('component base args', () => {
        nodeGetterSpec();
        lifeCyclesSpec();
        createRefSpec();
        contextRefsSpec();
    });
});
