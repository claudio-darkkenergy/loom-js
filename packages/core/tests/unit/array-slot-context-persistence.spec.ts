import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { appendChildContext } from '../../src/lib/context/helpers';
import type { ComponentContextPartial } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Mirrors the docs-page shape that exposed the array-slot context bug:
// an `activity.effect` wraps a component whose `${children}` slot holds an
// array — a static sibling plus a nested array of `activity.effect` children
// (flattened one level at the component boundary).
const Toolbar = component(
    (html) => html`
        <header data-toolbar></header>
    `
);
const Panel = component<{ color?: string }>(
    (html, { color }) => html`
        <p data-panel=${color}></p>
    `
);
const Shell = component<{ className?: string }>(
    (html, { children, className }) => html`
        <section class=${className}>${children}</section>
    `
);

describe('array-slot context persistence', () => {
    describe('effect-driven re-renders of an array slot', () => {
        const setup = async () => {
            const toggle = activity(false);
            const topic = activity('red');
            const panelSpy = sinon.fake(({ value: color }: { value: string }) =>
                Panel({ color })
            );
            const TestComponent = component(
                (html) => html`
                    <main>
                        ${toggle.effect(({ value: isOpen }) =>
                            Shell({
                                children: [
                                    Toolbar({}),
                                    [topic.effect(panelSpy)]
                                ],
                                className: isOpen ? '_open' : ''
                            })
                        )}
                    </main>
                `
            );
            const $test = await runSetup({
                containerProps: { TestComponent }
            });

            return { $test, panelSpy, toggle, topic };
        };

        it('reuses array-slot item DOM nodes across toggles', async () => {
            const { $test, toggle } = await setup();
            const toolbarBefore = $test.querySelector('[data-toolbar]');
            const panelBefore = $test.querySelector('[data-panel]');
            expect(toolbarBefore, 'toolbar rendered').to.exist;
            expect(panelBefore, 'panel rendered').to.exist;

            toggle.update(true);
            toggle.update(false);

            expect(
                $test.querySelector('[data-toolbar]'),
                'toolbar reused'
            ).to.equal(toolbarBefore);
            expect(
                $test.querySelector('[data-panel]'),
                'panel reused'
            ).to.equal(panelBefore);
        });

        it('keeps a single subscription for a nested effect across toggles', async () => {
            const { panelSpy, toggle, topic } = await setup();

            toggle.update(true);
            toggle.update(false);
            panelSpy.resetHistory();

            topic.update('blue');

            // One live effect — one action run per update. Accumulating
            // subscriptions would run the action once per stale context.
            expect(panelSpy.callCount, 'one action run per update').to.equal(1);
        });

        it('renders exactly one subtree after repeated toggles & updates', async () => {
            const { $test, toggle, topic } = await setup();

            toggle.update(true);
            toggle.update(false);
            toggle.update(true);
            topic.update('blue');
            topic.update('green');

            expect(
                $test.querySelectorAll('section').length,
                'one shell'
            ).to.equal(1);
            expect(
                $test.querySelectorAll('[data-toolbar]').length,
                'one toolbar'
            ).to.equal(1);
            expect(
                $test.querySelectorAll('[data-panel]').length,
                'one panel'
            ).to.equal(1);
        });
    });

    describe('appendChildContext (array values)', () => {
        it('returns a persistent context for an array value', () => {
            const parentCtx: ComponentContextPartial = {};
            const first = appendChildContext(parentCtx, ['x'], 0);
            const second = appendChildContext(parentCtx, ['y'], 0);

            expect(first, 'array slot gets a context').to.exist;
            expect(second, 'context is reused across updates').to.equal(first);
        });

        it('does not collide with a component context at the same key', () => {
            const parentCtx: ComponentContextPartial = {};
            const componentCtx = appendChildContext(parentCtx, Toolbar({}), 0);
            const arrayCtx = appendChildContext(parentCtx, ['x'], 0);

            expect(arrayCtx, 'array slot gets a context').to.exist;
            expect(
                arrayCtx,
                'distinct from the component context'
            ).to.not.equal(componentCtx);
        });

        it('drops the stale array context when the slot becomes a component', () => {
            const parentCtx: ComponentContextPartial = {};
            const arrayCtx = appendChildContext(parentCtx, ['x'], 0);

            appendChildContext(parentCtx, Toolbar({}), 0);

            expect(
                appendChildContext(parentCtx, ['x'], 0),
                'stale array context dropped'
            ).to.not.equal(arrayCtx);
        });

        it('drops the stale array context when the slot becomes a primitive', () => {
            const parentCtx: ComponentContextPartial = {};
            const arrayCtx = appendChildContext(parentCtx, ['x'], 0);

            appendChildContext(parentCtx, 'text', 0);

            expect(
                appendChildContext(parentCtx, ['x'], 0),
                'stale array context dropped'
            ).to.not.equal(arrayCtx);
        });
    });
});
