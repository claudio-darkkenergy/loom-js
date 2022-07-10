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
    const testRunSetup = ({ effect }) =>
        runSetup({
            containerProps: {
                componentProps: {
                    className: componentClassName,
                    value: testText
                },
                effect,
                TestComponent: Input
            }
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

    afterEach(() => {
        $test?.remove();
    });
});
