import { expect } from '@esm-bundle/chai';

import { component, defineElement } from '../../../src';
import { runSetup } from '../../support/run-setup';

// The shadow-boundary probe for `add-named-slots` (its task 1.1): the two
// distribution worlds — loom's compiled path and the platform's native
// `<slot>` mechanism — can never meet on the same nodes.

// `customElements.define` is process-global and irreversible, so every
// element in this file owns a unique name.
defineElement(
    'ns-shadow-native-probe',
    (html) => html`
        <div class="probe-root"><slot name="x"></slot></div>
    `,
    { shadow: { mode: 'open' } }
);

const ShadowCompiledProbe = defineElement(
    'ns-shadow-compiled-probe',
    (html) => html`
        <div class="compiled-probe"><slot name="x"></slot></div>
    `,
    { shadow: { mode: 'open' } }
);

describe('named slots — shadow boundary', () => {
    it('distributes `[slot]` children of custom-element markup natively, undisturbed by loom', async () => {
        // Plain custom-element markup carries no component-tag signal, so
        // the transform never scans it — the native parser builds it, the
        // element upgrades on connect, and the platform distributes.
        const TestComponent = component(
            (html) => html`
                <main>
                    <ns-shadow-native-probe>
                        <span class="labelled" slot="x">hi</span>
                    </ns-shadow-native-probe>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $host = $test.querySelector('ns-shadow-native-probe');
        const $span = $host?.querySelector('span.labelled');

        expect($host, 'host rendered').to.exist;
        expect(
            $span?.parentElement,
            'labelled child stays a light-DOM child of the host'
        ).to.equal($host);
        expect($host?.shadowRoot, 'shadow root attached').to.exist;
        expect(
            ($span as HTMLElement).assignedSlot,
            'native distribution assigned the labelled child'
        ).to.equal($host?.shadowRoot?.querySelector('slot[name="x"]'));
    });

    it('never engages the shadow root when a `defineElement` component is composed via element syntax', async () => {
        // Composing the component function renders its template directly —
        // no custom element is instantiated, so no shadow root exists on
        // the compiled path and loom's distribution is the only one.
        const TestComponent = component(
            (html) => html`
                <main><${ShadowCompiledProbe}><span slot="x">hi</span></></main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });

        expect(
            $test.querySelector('ns-shadow-compiled-probe'),
            'no custom element instantiated'
        ).to.equal(null);

        const $root = $test.querySelector('main .compiled-probe');

        expect($root, 'template rendered directly').to.exist;
        expect(
            $root?.getRootNode(),
            'rendered into the light DOM, not a shadow root'
        ).to.equal(document);
    });
});
