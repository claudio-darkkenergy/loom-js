import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { activity } from '../../src/activity';
import { TestComponentProps } from '../support/components/container';
import { Input } from '../support/components/input';
import { runSetup } from '../support/run-setup';
import { ComponentOptionalProps, component } from '../../src';

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

    describe('effect()', () => {
        const { effect } = activity<TestComponentProps>({});

        it('should render a component', async () => {
            $test = await testRunSetup({ effect });
            $unit = $test.querySelector('input');

            expect($unit?.localName).to.equal('input');
            expect($unit?.textContent).to.equal('');
        });

        it('should render a `TemplateTagValue` when nesting effects', async () => {
            let $nestedUnit: HTMLSpanElement | null;
            let $childUnit: HTMLParagraphElement | null;
            const { effect: parentEffect, value: outerValue } = activity(3);
            const {
                effect: nestedEffect,
                update: nestedUpdate,
                value: nestedValue
            } = activity(3);
            const { effect: childEffect, value: childValue } = activity(5);
            const TestComponent = component(
                (html) => html`
                    <div>
                        ${parentEffect(({ value: outerMultiplier }) =>
                            nestedEffect(({ value: nestedMultiplier }) =>
                                ChildComponent({
                                    value: outerMultiplier * nestedMultiplier
                                })
                            )
                        )}
                    </div>
                `
            );
            const ChildComponent = component<TestComponentProps>(
                (html, { value }) =>
                    html`<div>
                        <span>${value}</span>
                        <p>${childEffect(({ value: num }) => num)}</p>
                    </div>`
            );

            $test = await runSetup({ containerProps: { TestComponent } });
            $nestedUnit = $test.querySelector('span');
            $childUnit = $test.querySelector('p');

            expect($nestedUnit?.textContent?.trim()).to.equal(
                String(outerValue() * nestedValue())
            );

            expect($childUnit?.textContent?.trim()).to.equal(
                String(childValue())
            );
            nestedUpdate(7);
            expect($childUnit?.textContent?.trim()).to.equal(
                String(childValue())
            );
        });
    });

    it('reset()', () => {
        const initValue = (Math.random() * 100) / 10;
        const updateValue = (Math.random() * 100) / 10;
        const { reset, update, value } = activity(initValue);

        expect(value()).to.equal(initValue);

        update(updateValue);
        expect(value()).to.equal(updateValue);

        reset();
        expect(value()).to.equal(initValue);
    });

    describe('update()', () => {
        const newClassName = 'update-test';

        describe('w/o transform', () => {
            it('should append to the classname', async () => {
                let updatedClassName: string;
                const { effect, update, value } = activity<
                    TestComponentProps & ComponentOptionalProps
                >({ className: componentClassName });

                $test = await testRunSetup({ effect });
                $unit = $test.querySelector('input');
                updatedClassName = `${value().className} ${newClassName}`;

                expect($unit?.className).to.equal(componentClassName);

                update({ className: updatedClassName });
                expect($unit?.className).to.equal(updatedClassName);
            });

            // @TODO Fix & finalize `shouldUpdate` logic (setup examples in experimental project)
            it('should update current change when `force` is `true`', async () => {
                const initValue = new Set([0]);
                const { update, value } = activity(initValue, { deep: false });

                const newValue = value().add(1);
                console.log({ newValue }, value() === initValue);

                // update(newValue);
                expect(value()).to.equal(newValue);

                // update(value(), true);
                // expect($unit?.className).to.equal(componentClassName);
            });
        });

        describe('w/ transform', () => {
            const { effect, update, value } = activity<
                TestComponentProps & ComponentOptionalProps
            >({ className: componentClassName }, ({ input, update, value }) =>
                update({
                    className: `${value?.className} ${input.className}`
                })
            );

            beforeEach(async () => {
                $test = await testRunSetup({ effect });
                $unit = $test.querySelector('input');
            });

            it('should append to the classname', () => {
                const updatedClassName = `${value().className} ${newClassName}`;

                expect($unit?.className).to.equal(componentClassName);

                update({ className: newClassName });
                expect($unit?.className).to.equal(updatedClassName);
            });
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
        const { update, watch } = activity(initValue);
        const watchAction = sinon.fake();

        watch(watchAction);
        update(updateValue);

        expect(watchAction.calledTwice).to.be.true;
        expect(watchAction.firstCall.calledWith({ value: initValue })).to.be
            .true;
        expect(watchAction.secondCall.calledWith({ value: updateValue })).to.be
            .true;
    });
});
