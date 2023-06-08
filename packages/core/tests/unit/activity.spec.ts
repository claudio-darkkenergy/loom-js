import { expect } from '@esm-bundle/chai';

import { activity } from '../../src/activity';
import { TestComponentProps } from '../support/components/container';
import { Input } from '../support/components/input';
import { runSetup } from '../support/run-setup';

describe('activity', () => {
    let $test: HTMLElement;
    let $unit: HTMLInputElement | null;
    const componentClassName = 'activity-test';
    const testText = 'Testing `activity`...';
    const testRunSetup = ({ asyncEffect = false, effect }) =>
        runSetup({
            containerProps: {
                asyncEffect,
                componentProps: {
                    className: componentClassName,
                    value: testText
                },
                effect,
                TestComponent: Input
            }
        });

    describe('effect()', () => {
        const { effect } = activity<TestComponentProps>({});

        it('should render a component', async () => {
            $test = await testRunSetup({ effect });
            $unit = $test.querySelector('input');
            expect($unit?.localName).to.equal('input');
        });

        it('should render an async component', async () => {
            $test = await testRunSetup({ asyncEffect: true, effect });
            $unit = $test.querySelector('input');
            expect($unit?.localName).to.equal('input');
        });
    });

    it('reset()', async () => {
        const initValue = (Math.random() * 100) / 10;
        const updateValue = (Math.random() * 100) / 10;
        const { initialValue, reset, update, value } = activity(initValue);

        expect(initialValue).to.equal(initValue);
        expect(value()).to.equal(initValue);
        await update(updateValue);
        expect(value()).to.equal(updateValue);
        reset();
        expect(value()).to.equal(initValue);
    });

    describe('update() w/o transform', () => {
        const { effect, update, value } = activity<TestComponentProps>({});

        beforeEach(async () => {
            $test = await testRunSetup({ effect });
            $unit = $test.querySelector('input');
        });

        it('should append to the classname', () => {
            const classNameToAppend = 'update-test';
            const updatedClassName = `${
                value().className
            } ${classNameToAppend}`;

            update({ className: updatedClassName });
            expect($unit?.className).to.equal(updatedClassName);
        });
    });

    describe('update() w/ transform', () => {
        const { effect, update, value } = activity<TestComponentProps>(
            {},
            ({ input, update, value }) =>
                update({
                    className: `${value?.className} ${input.className}`
                })
        );

        beforeEach(async () => {
            $test = await testRunSetup({ effect });
            $unit = $test.querySelector('input');
        });

        it('should append to the classname', () => {
            const classNameToAppend = 'update-test';
            const updatedClassName = `${
                value().className
            } ${classNameToAppend}`;

            update({ className: classNameToAppend });
            expect($unit?.className).to.equal(updatedClassName);
        });
    });

    describe('value()', () => {
        const defaultTestText = 'Testing `activity.value()`...';
        const updatedTestText = '`activity.value()` updated!';
        let valueActivity: ReturnType<typeof activity<TestComponentProps>>;

        beforeEach(async () => {
            valueActivity = activity<TestComponentProps>({
                value: defaultTestText
            });
            const { effect } = valueActivity;

            $test = await testRunSetup({ effect });
            $unit = $test.querySelector('input');
        });

        it('should equal the default value', () => {
            const { value } = valueActivity;
            expect(value().value).to.equal(defaultTestText);
        });

        it('should equal the updated value', () => {
            const { update, value } = valueActivity;

            update({ value: updatedTestText });
            expect(value().value).to.equal(updatedTestText);
        });

        it('should not update the `initialValue`', () => {
            const { initialValue, update, value } = valueActivity;
            expect(value().value, '1').to.equal(initialValue.value);
            update({ value: updatedTestText });
            expect(defaultTestText, '2').to.equal(initialValue.value);
            expect(value().value, '3').to.not.equal(initialValue.value);
        });
    });

    it('watch()', () => {
        const initValue = 'hello';
        const updateValue = 'world';
        const { update, value, watch } = activity(initValue);

        watch(({ value: newValue }) => {
            expect(newValue).to.equal(updateValue);
            expect(value()).to.equal(updateValue);
        });
        update(updateValue);
    });

    afterEach(() => {
        $test?.remove();
    });
});
