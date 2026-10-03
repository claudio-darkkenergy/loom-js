import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { renderToString } from '../../src/server';
import { runSetup } from '../support/run-setup';
import { createServerWindow } from '../support/server-window';

// MutationObserver delivery is a microtask; a macrotask hop runs after it.
const waitForObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('life-cycle dispatch', () => {
    it('should run handlers in registration order, then the ref handler', async () => {
        const calls: string[] = [];
        const Child = component((html, { onMounted }) => {
            onMounted(() => calls.push('own-1'));
            onMounted(() => calls.push('own-2'));

            return html`
                <p>child</p>
            `;
        });
        const TestComponent = component((html, { createRef }) => {
            const childRef = createRef();

            childRef.onMounted(() => calls.push('ref'));

            return html`
                <article>${Child({ ref: childRef })}</article>
            `;
        });

        await runSetup({ containerProps: { TestComponent } });

        expect(calls).to.deep.equal(['own-1', 'own-2', 'ref']);
    });

    it('should not re-run onMounted when a mounted node is moved', async () => {
        const mounted = sinon.fake();
        const Item = component<{ label?: string }>(
            (html, { label, onMounted }) => {
                onMounted(() => mounted(label));

                return html`
                    <li data-item=${label}></li>
                `;
            }
        );
        const order = activity(['a', 'b'], { deep: true });
        const TestComponent = component(
            (html) => html`
                <ul>
                    ${order.effect(({ value }) =>
                        value.map((label) => Item({ key: label, label }))
                    )}
                </ul>
            `
        );

        await runSetup({ containerProps: { TestComponent } });
        expect(mounted.callCount, 'mounted once each').to.equal(2);

        order.update(['b', 'a']);
        await waitForObserver();

        expect(mounted.callCount, 'a move is not a mount').to.equal(2);
    });

    it('should dispatch render events but never mount events on the server', async () => {
        const events: string[] = [];
        const Page = component(
            (
                html,
                {
                    onBeforeRender,
                    onCreated,
                    onMounted,
                    onRendered,
                    onUnmounted
                }
            ) => {
                onCreated(() => events.push('created'));
                onBeforeRender(() => events.push('beforeRender'));
                onRendered(() => events.push('rendered'));
                onMounted(() => events.push('mounted'));
                onUnmounted(() => events.push('unmounted'));

                return html`
                    <main>page</main>
                `;
            }
        );

        const markup = await renderToString(Page(), {
            window: createServerWindow()
        });

        expect(markup).to.contain('<main>page</main>');
        expect(events).to.deep.equal(['created', 'beforeRender', 'rendered']);
    });
});
