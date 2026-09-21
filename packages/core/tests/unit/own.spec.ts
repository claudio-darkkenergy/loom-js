import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { setDebug } from '../../src/config';
import { renderToString } from '../../src/server';
import { runSetup } from '../support/run-setup';
import { createServerWindow } from '../support/server-window';

// Specs for the `component-instance-state` capability: `own` caches a
// factory's result per component instance in call order — first render
// creates, re-renders replay — so locally created state (idiomatically an
// activity) survives parent-triggered re-renders. Call-order misuse gets a
// narration-gated warning; values live exactly as long as the component's
// context (released on unmount, isolated per instance and per window).

type BooleanActivity = ReturnType<typeof activity<boolean>>;
type StringActivity = ReturnType<typeof activity<string>>;

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('own (component instance state)', () => {
    afterEach(() => {
        setDebug(false);
        sinon.restore();
    });

    describe('instance-memoized values survive re-renders', () => {
        it('should preserve the value across a parent-triggered re-render without re-invoking the factory', async () => {
            const label = activity('a');
            const factory = sinon.fake(() => activity(false));
            const captured: BooleanActivity[] = [];
            const Child = component<{ label?: string }>(
                (html, { label: labelProp, own }) => {
                    const isOpen = own(factory);

                    captured.push(isOpen);

                    return html`
                        <section data-label=${labelProp}>
                            ${isOpen.effect(({ value }) => `open: ${value}`)}
                        </section>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${label.effect(({ value }) => Child({ label: value }))}
                    </main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const $section = $test.querySelector('[data-label]');

            expect(factory.callCount).to.equal(1);
            expect($section?.textContent).to.contain('open: false');

            captured[0]!.update(true);
            expect($section?.textContent).to.contain('open: true');

            // The probe: a parent re-render re-runs the render function...
            label.update('b');

            expect($section?.getAttribute('data-label')).to.equal('b');
            // ...but the cached value replays — same instance, state intact.
            expect(factory.callCount).to.equal(1);
            expect(captured.at(-1), 'same activity instance').to.equal(
                captured[0]
            );
            expect($section?.textContent).to.contain('open: true');
        });

        it('should give each instance of one component its own cached values', async () => {
            const captured = new Map<string, StringActivity>();
            const Field = component<{ id?: string }>((html, { id, own }) => {
                const state = own(() => activity('initial'));

                id && captured.set(id, state);

                return html`
                    <p data-id=${id}>
                        ${state.effect(({ value }) => `state: ${value}`)}
                    </p>
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <div>
                        ${Field({ id: 'first' })}${Field({ id: 'second' })}
                    </div>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });
            const textOf = (id: string) =>
                $test.querySelector(`[data-id="${id}"]`)?.textContent;

            expect(captured.get('first'), 'distinct instances').to.not.equal(
                captured.get('second')
            );

            captured.get('first')!.update('changed');

            expect(textOf('first')).to.contain('state: changed');
            expect(textOf('second'), 'second untouched').to.contain(
                'state: initial'
            );
        });
    });

    describe('call order is the identity', () => {
        let warnStub: sinon.SinonStub;

        beforeEach(() => {
            warnStub = sinon.stub(globalThis.console, 'warn');
            // Silence the debug-lane narration the specs don't assert on.
            sinon.stub(globalThis.console, 'info');
            sinon.stub(globalThis.console, 'log');
            sinon.stub(globalThis.console, 'group');
            sinon.stub(globalThis.console, 'groupCollapsed');
            sinon.stub(globalThis.console, 'groupEnd');
        });

        it('should warn when a re-render calls `own` more times than the first render', async () => {
            setDebug(true);

            const label = activity('a');
            let overrun = false;
            const Child = component<{ label?: string }>(
                (html, { label: labelProp, own }) => {
                    const first = own(() => 'one');

                    overrun && own(() => 'two');

                    return html`
                        <p data-label=${labelProp}>${first}</p>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${label.effect(({ value }) => Child({ label: value }))}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(warnStub.callCount).to.equal(0);

            overrun = true;
            label.update('b');

            expect(warnStub.callCount).to.equal(1);
            expect(warnStub.firstCall.args[0]).to.contain('own');
        });

        it('should warn when a re-render calls `own` fewer times than the first render', async () => {
            setDebug(true);

            const label = activity('a');
            let underrun = false;
            const Child = component<{ label?: string }>(
                (html, { label: labelProp, own }) => {
                    const first = own(() => 'one');

                    !underrun && own(() => 'two');

                    return html`
                        <p data-label=${labelProp}>${first}</p>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${label.effect(({ value }) => Child({ label: value }))}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            expect(warnStub.callCount).to.equal(0);

            underrun = true;
            label.update('b');

            expect(warnStub.callCount).to.equal(1);
            expect(warnStub.firstCall.args[0]).to.contain('own');
        });

        it('should stay silent about a mismatch when narration is off', async () => {
            const label = activity('a');
            let overrun = false;
            const Child = component<{ label?: string }>(
                (html, { label: labelProp, own }) => {
                    const first = own(() => 'one');

                    overrun && own(() => 'two');

                    return html`
                        <p data-label=${labelProp}>${first}</p>
                    `;
                }
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${label.effect(({ value }) => Child({ label: value }))}
                    </main>
                `
            );

            await runSetup({ containerProps: { TestComponent } });

            overrun = true;
            label.update('b');

            expect(warnStub.callCount).to.equal(0);
        });
    });

    describe('lifetime follows the component context', () => {
        it('should release cached values on unmount so a remount starts fresh', async () => {
            const show = activity(true);
            const factory = sinon.fake(() => activity('fresh'));
            const captured: StringActivity[] = [];
            const Child = component((html, { own }) => {
                const state = own(factory);

                captured.push(state);

                return html`
                    <p data-child>
                        ${state.effect(({ value }) => `state: ${value}`)}
                    </p>
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <article>
                        ${show.effect(({ value: isShown }) =>
                            isShown ? Child({}) : 'hidden'
                        )}
                    </article>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            expect(factory.callCount).to.equal(1);

            captured[0]!.update('dirty');
            expect($test.querySelector('[data-child]')?.textContent).to.contain(
                'state: dirty'
            );

            // Hide — the child unmounts; its context releases the storage.
            show.update(false);
            await waitForObserver();

            // Show again — a fresh first render, not a replay.
            show.update(true);

            expect(factory.callCount).to.equal(2);
            expect(captured.at(-1), 'fresh instance').to.not.equal(captured[0]);
            expect($test.querySelector('[data-child]')?.textContent).to.contain(
                'state: fresh'
            );
        });

        it('should isolate cached values per window across server renders', async () => {
            const factory = sinon.fake(() => activity('initial'));
            const captured: StringActivity[] = [];
            const Page = component((html, { own }) => {
                const state = own(factory);

                captured.push(state);

                return html`
                    <p data-page>
                        ${state.effect(({ value }) => `state: ${value}`)}
                    </p>
                `;
            });
            const TestComponent = component(
                (html) => html`
                    <main>${Page({})}</main>
                `
            );

            const $test = await runSetup({ containerProps: { TestComponent } });

            captured[0]!.update('browser-only');
            expect($test.querySelector('[data-page]')?.textContent).to.contain(
                'state: browser-only'
            );

            // A server render of the same component gets its own storage —
            // a fresh creation, never a replay from the browser instance.
            const markup = await renderToString(Page({}), {
                window: createServerWindow()
            });

            expect(markup).to.contain('state: initial');
            expect(factory.callCount).to.equal(2);
            // The browser instance is untouched by the server render.
            expect($test.querySelector('[data-page]')?.textContent).to.contain(
                'state: browser-only'
            );
        });
    });
});
