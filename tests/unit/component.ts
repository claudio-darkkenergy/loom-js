import { SinonSpy, spy } from 'sinon';

import { ComponentFunction, ComponentWrapper } from '../../src/types';
import { tdd, chai } from '../support/intern-interfaces';
import { ComponentMock } from '../support/mocks/component';
import { argException, callCountException } from '../support/utils';

interface TestComponentProps {
    title: string;
}

const { before, suite, test } = tdd;
const { expect } = chai;

suite('Component', () => {
    let Component: ComponentWrapper;
    let TemplateSpy: SinonSpy;
    let TestComponent: ComponentFunction<TestComponentProps>;
    const title1 = 'Hello World!';
    const title2 = 'My name is...';

    before(() => {
        TemplateSpy = spy();
        Component = ComponentMock({
            Template: TemplateSpy
        });
        TestComponent = Component(
            (template, { title }: TestComponentProps) => template`
                <h1>${title}</h1>
            `
        );

        TestComponent({ title: title1 });
        TestComponent({ title: title2 });
    });

    test('should call the NodeTemplateFunction', () => {
        expect(
            TemplateSpy.calledTwice,
            callCountException(TemplateSpy.callCount)
        ).to.be.true;
    });

    test('should call the NodeTemplateFunction with correct arguments', () => {
        const firstCallArg1 = TemplateSpy.firstCall.args[0].length;
        const secondCallArg1 = TemplateSpy.secondCall.args[0].length;

        // 1st Call
        expect(firstCallArg1, argException(firstCallArg1, 1)).to.equal(2);
        expect(TemplateSpy.firstCall.args[1], argException(title1, 2)).to.equal(
            title1
        );

        // 2nd Call
        expect(secondCallArg1, argException(secondCallArg1, 1)).to.equal(2);
        expect(
            TemplateSpy.secondCall.args[1],
            argException(title2, 2)
        ).to.equal(title2);
    });
});
