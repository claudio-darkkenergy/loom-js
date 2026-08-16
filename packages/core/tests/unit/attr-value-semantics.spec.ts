import { expect } from '@esm-bundle/chai';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// Specs for the `attr-value-semantics` capability (`docs-readiness`): falsy
// template values remove the attribute — supporting boolean attributes
// (`disabled=${false}`) and conditional attributes — EXCEPT the number `0`,
// which renders like any truthy value in every attribute-setting path.
// Text interpolation's zero-preservation is pinned alongside for symmetry.

describe('attr value semantics', () => {
    describe('zero attribute values', () => {
        it('renders 0 in a standard attribute slot', async () => {
            const TestComponent = component(
                (html) => html`
                    <p data-zero-test tabindex=${0} data-count=${0}>zero</p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-zero-test]');

            expect($unit?.getAttribute('tabindex')).to.equal('0');
            expect($unit?.getAttribute('data-count')).to.equal('0');
        });

        it('sets the value prop for a value of 0', async () => {
            const TestComponent = component(
                (html) => html`
                    <input data-value-test value=${0} />
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit =
                $test.querySelector<HTMLInputElement>('[data-value-test]');

            expect($unit?.value).to.equal('0');
        });

        it('renders a $attrs entry of 0', async () => {
            const TestComponent = component(
                (html) => html`
                    <p data-attrs-zero-test $attrs=${{ 'data-count': 0 }}>
                        attrs zero
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-attrs-zero-test]');

            expect($unit?.getAttribute('data-count')).to.equal('0');
        });

        it('keeps an attribute at 0 through a binding & removes it on undefined', async () => {
            const count = activity<number | undefined>(1);
            const TestComponent = component(
                (html) => html`
                    <p data-binding-zero-test data-count=${count.bind()}>
                        bound zero
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-binding-zero-test]');

            expect($unit?.getAttribute('data-count')).to.equal('1');

            count.update(0);

            expect($unit?.getAttribute('data-count')).to.equal('0');

            count.update(undefined);

            expect($unit?.hasAttribute('data-count')).to.equal(false);
        });
    });

    describe('other falsy attribute values', () => {
        it('omits the attribute for false, null, undefined, empty string, & NaN', async () => {
            const TestComponent = component(
                (html) => html`
                    <p
                        data-falsy-test
                        data-a=${false}
                        data-b=${null}
                        data-c=${undefined}
                        data-d=${''}
                        data-e=${NaN}
                    >
                        falsy
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-falsy-test]');

            ['data-a', 'data-b', 'data-c', 'data-d', 'data-e'].forEach(
                (attrName) => {
                    expect($unit?.hasAttribute(attrName)).to.equal(false);
                }
            );
        });
    });

    describe('zero text values', () => {
        it('renders "0" in a text slot', async () => {
            const TestComponent = component(
                (html) => html`
                    <p data-text-zero-test>${0}</p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });

            expect(
                $test.querySelector('[data-text-zero-test]')?.textContent
            ).to.equal('0');
        });

        it('renders empty text for nullish & false values', async () => {
            const TestComponent = component(
                (html) => html`
                    <p data-text-nullish-test>${undefined}${null}${false}</p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });

            expect(
                $test.querySelector('[data-text-nullish-test]')?.textContent
            ).to.equal('');
        });
    });
});
