import { expect } from '@esm-bundle/chai';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// Specs for the `reactive-attr-bindings` capability
// (`add-reactive-attr-bindings`): `activity.bind(select?)` keeps a single
// DOM attribute in sync with an activity — applied immediately, updated per
// activity update without re-rendering the component, swap-safe across
// re-renders, and released on unmount via context teardown.

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('reactive attr bindings', () => {
    describe('standard attribute bindings', () => {
        it('applies immediately and tracks updates without re-rendering', async () => {
            const title = activity('one');
            let renderCount = 0;
            const TestComponent = component((html) => {
                renderCount++;

                return html`
                    <p
                        data-binding-test
                        data-title=${title.bind(
                            (titleValue) => `t-${titleValue}`
                        )}
                    >
                        static content
                    </p>
                `;
            });
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-binding-test]');

            expect($unit?.getAttribute('data-title')).to.equal('t-one');
            expect(renderCount).to.equal(1);

            title.update('two');

            expect($unit?.getAttribute('data-title')).to.equal('t-two');
            expect(renderCount).to.equal(1);
            expect(
                $test
                    .querySelector('[data-binding-test]')
                    ?.isSameNode($unit ?? null)
            ).to.equal(true);
        });
    });

    describe('$attrs entry bindings', () => {
        it('keeps a bound entry live while sibling entries stay static', async () => {
            const flag = activity(true);
            const TestComponent = component(
                (html) => html`
                    <p
                        data-attrs-test
                        $attrs=${{
                            'data-bound': flag.bind((flagValue) =>
                                flagValue ? 'yes' : 'no'
                            ),
                            'data-static': 'fixed'
                        }}
                    >
                        attrs content
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-attrs-test]');

            expect($unit?.getAttribute('data-bound')).to.equal('yes');
            expect($unit?.getAttribute('data-static')).to.equal('fixed');

            flag.update(false);

            expect($unit?.getAttribute('data-bound')).to.equal('no');
            expect($unit?.getAttribute('data-static')).to.equal('fixed');
        });
    });

    describe('swap and teardown semantics', () => {
        it('holds one live subscription across re-renders', async () => {
            const label = activity('a');
            const bound = activity('x');
            const Child = component<{ label?: string }>(
                (html, { label: labelValue }) => html`
                    <p
                        data-swap-test
                        data-label=${labelValue}
                        data-bound=${bound.bind(
                            (boundValue) => `b-${boundValue}`
                        )}
                    >
                        swap content
                    </p>
                `
            );
            const TestComponent = component(
                (html) => html`
                    <div>
                        ${label.effect(({ value: labelValue }) =>
                            Child({ label: labelValue })
                        )}
                    </div>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-swap-test]');

            // Re-render the child (and its bound attr slot) twice.
            label.update('b');
            label.update('c');
            expect($unit?.getAttribute('data-label')).to.equal('c');

            // With one live subscription, a single update applies the
            // attribute exactly once.
            let attributeWrites = 0;
            const observer = new MutationObserver((records) => {
                attributeWrites += records.length;
            });

            observer.observe($unit as Element, {
                attributes: true,
                attributeFilter: ['data-bound']
            });
            bound.update('y');
            await waitForObserver();
            observer.disconnect();

            expect($unit?.getAttribute('data-bound')).to.equal('b-y');
            expect(attributeWrites).to.equal(1);
        });

        it('releases the binding when the component unmounts', async () => {
            const bound = activity('before');
            const TestComponent = component(
                (html) => html`
                    <p
                        data-teardown-test
                        data-bound=${bound.bind(
                            (boundValue) => `b-${boundValue}`
                        )}
                    >
                        teardown content
                    </p>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });
            const $unit = $test.querySelector('[data-teardown-test]');

            expect($unit?.getAttribute('data-bound')).to.equal('b-before');

            $unit?.remove();
            await waitForObserver();

            bound.update('after');

            expect($unit?.getAttribute('data-bound')).to.equal('b-before');
        });
    });
});
