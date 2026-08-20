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

    describe('style values apply by replacement', () => {
        it('leaves no style attribute for empty-resolving object & array values', async () => {
            const TestComponent = component(
                (html) => html`
                    <div data-style-empty-test>
                        <p data-empty-object style=${{}}>empty object</p>
                        <p data-empty-array style=${[]}>empty array</p>
                        <p data-nullish-object style=${{ color: undefined }}>
                            nullish object
                        </p>
                        <p
                            data-nullish-array
                            style=${[{ color: undefined }, undefined]}
                        >
                            nullish array
                        </p>
                    </div>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-style-empty-test]');

            [
                'data-empty-object',
                'data-empty-array',
                'data-nullish-object',
                'data-nullish-array'
            ].forEach((attrName) => {
                expect(
                    $unit?.querySelector(`[${attrName}]`)?.hasAttribute('style')
                ).to.equal(false);
            });
            expect($unit?.outerHTML).to.not.contain('⚡');
        });

        it('removes a property dropped by a re-applied style value', async () => {
            const styleValue = activity<Record<string, string | undefined>>({
                color: 'red',
                margin: '4px'
            });
            const TestComponent = component(
                (html) => html`
                    <p data-style-drop-test style=${styleValue.bind()}>
                        style drop
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector<HTMLElement>(
                '[data-style-drop-test]'
            );

            expect($unit?.style.color).to.equal('red');
            expect($unit?.style.margin).to.equal('4px');

            styleValue.update({ color: 'blue' });

            expect($unit?.style.color).to.equal('blue');
            expect($unit?.style.margin).to.equal('');
        });

        it('replaces identically through a $attrs style entry', async () => {
            const styleValue = activity<Record<string, string | undefined>>({
                color: 'red',
                margin: '4px'
            });
            const TestComponent = component(
                (html) => html`
                    <p
                        data-attrs-style-test
                        $attrs=${{ style: styleValue.bind() }}
                    >
                        attrs style
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector<HTMLElement>(
                '[data-attrs-style-test]'
            );

            expect($unit?.style.color).to.equal('red');

            styleValue.update({ color: 'blue' });

            expect($unit?.style.color).to.equal('blue');
            expect($unit?.style.margin).to.equal('');

            styleValue.update({ color: undefined });

            expect($unit?.hasAttribute('style')).to.equal(false);
        });

        it('merges array entries within one application', async () => {
            const TestComponent = component(
                (html) => html`
                    <p
                        data-style-merge-test
                        style=${['color: red;', { margin: '4px' }]}
                    >
                        style merge
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector<HTMLElement>(
                '[data-style-merge-test]'
            );

            expect($unit?.style.color).to.equal('red');
            expect($unit?.style.margin).to.equal('4px');
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
