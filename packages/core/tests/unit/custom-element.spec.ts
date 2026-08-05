import { expect } from '@esm-bundle/chai';

import { component, defineElement } from '../../src';
import type { TestComponentProps } from '../support/components/container';
import { runSetup } from '../support/run-setup';

/**
 * `customElements.define` is process-global and irreversible — an element name
 * can never be re-defined or un-defined. Every case below therefore owns a
 * unique element name, and no element is shared across `it` blocks.
 */

interface CustomElementProps {
    value: string;
}

defineElement<CustomElementProps>(
    'ce-light-unit',
    (html, { value }) => html`
        <p class="unit">${value}</p>
    `
);

defineElement<CustomElementProps>(
    'ce-shadow-unit',
    (html, { value }) => html`
        <p class="unit">${value}</p>
    `,
    { shadow: { mode: 'open' } }
);

defineElement<CustomElementProps>(
    'ce-attr-unit',
    (html, { value }) => html`
        <p class="unit">${value}</p>
    `
);

// Captures the props the element actually received, so the test can assert on
// identity rather than on rendered text.
let receivedProps: Record<string, any> = {};

defineElement('ce-props-unit', (html, props) => {
    receivedProps = props as Record<string, any>;
    return html`
        <p class="unit">received</p>
    `;
});

defineElement(
    'ce-children-unit',
    (html, { children }) => html`
        <div class="wrap">${children}</div>
    `
);

defineElement<CustomElementProps>(
    'ce-fragment-unit',
    (html, { value }) => html`
        <>
            <h1 class="first">${value}</h1>
            <p class="second">${value}</p>
        </>
    `
);

describe('custom element', () => {
    describe('registration is explicit', () => {
        it('does not define an element for an anonymous template function', () => {
            component<CustomElementProps>(
                (html, { value }) => html`
                    <p>${value}</p>
                `
            );

            expect(window.customElements.get('ce-anon-unit')).to.equal(
                undefined
            );
        });

        it('does not define an element for a *named* template function', () => {
            // The old behavior derived the element name from
            // `templateFunction.name` via `toKebabCase`. That path is gone.
            component<CustomElementProps>(function CeNamedUnit(
                html,
                { value }
            ) {
                return html`
                    <p>${value}</p>
                `;
            });

            expect(window.customElements.get('ce-named-unit')).to.equal(
                undefined
            );
        });

        it('defines an element when `defineElement` is used', () => {
            expect(window.customElements.get('ce-light-unit')).to.not.equal(
                undefined
            );
        });

        it('returns a directly callable component from `defineElement`', () => {
            expect(window.customElements.get('ce-attr-unit')).to.not.equal(
                undefined
            );
            expect(
                typeof defineElement(
                    'ce-callable-unit',
                    (html) => html`
                        <p></p>
                    `
                )
            ).to.equal('function');
        });

        it('throws on an element name without a hyphen', () => {
            expect(() =>
                defineElement(
                    'nohyphen',
                    (html) => html`
                        <p></p>
                    `
                )
            ).to.throw(/nohyphen/);
        });

        it('throws on a duplicate registration', () => {
            defineElement(
                'ce-duplicate-unit',
                (html) => html`
                    <p></p>
                `
            );

            expect(() =>
                defineElement(
                    'ce-duplicate-unit',
                    (html) => html`
                        <p></p>
                    `
                )
            ).to.throw(/ce-duplicate-unit/);
        });
    });

    describe('light DOM (default)', () => {
        const testText = 'Testing the light-DOM custom element...';
        let $unit: HTMLElement;

        before(() => {
            $unit = document.createElement('ce-light-unit');
            $unit.setAttribute('$value', testText);
            document.body.append($unit);
        });

        after(() => $unit.remove());

        it('creates no shadow root', () => {
            expect($unit.shadowRoot).to.equal(null);
        });

        it('renders its content as a direct child of the host', () => {
            const $rendered = $unit.querySelector('p.unit');

            expect($rendered).to.be.instanceof(HTMLParagraphElement);
            expect($rendered?.parentElement).to.equal($unit);
        });

        it('is reachable by document-level CSS selectors', () => {
            expect(document.querySelector('ce-light-unit p.unit')).to.not.equal(
                null
            );
        });
    });

    describe('shadow root (opt-in)', () => {
        const testText = 'Testing the shadow-rooted custom element...';
        let $unit: HTMLElement;

        before(() => {
            $unit = document.createElement('ce-shadow-unit');
            $unit.setAttribute('$value', testText);
            document.body.append($unit);
        });

        after(() => $unit.remove());

        it('renders into an open shadow root', () => {
            expect($unit.shadowRoot).to.not.equal(null);
            expect($unit.shadowRoot?.querySelector('p.unit')).to.be.instanceof(
                HTMLParagraphElement
            );
        });

        it('renders nothing into the light DOM', () => {
            expect($unit.querySelector('p.unit')).to.equal(null);
        });
    });

    describe('`$`-prefixed attributes', () => {
        const testText = 'Testing the attribute mapping...';
        let $unit: HTMLElement;

        before(() => {
            $unit = document.createElement('ce-attr-unit');
            $unit.setAttribute('$value', testText);
            document.body.append($unit);
        });

        after(() => $unit.remove());

        it('maps `$`-prefixed attributes to camelCase props', () => {
            expect($unit.querySelector('p.unit')?.textContent?.trim()).to.equal(
                testText
            );
        });
    });

    describe('interpolated props from a loom template', () => {
        const config = { nested: { depth: 2 } };
        const handler = () => 'called';

        before(async () => {
            receivedProps = {};

            const PropsHost = component<TestComponentProps>(
                (html) => html`
                    <ce-props-unit
                        $config=${config}
                        $handler=${handler}
                    ></ce-props-unit>
                `
            );

            await runSetup({
                containerProps: { TestComponent: PropsHost }
            });
        });

        it('passes objects by reference, uncoerced', () => {
            expect(receivedProps.config).to.equal(config);
        });

        it('passes functions by reference, uncoerced', () => {
            expect(receivedProps.handler).to.equal(handler);
        });
    });

    describe('children pass-through', () => {
        let $unit: HTMLElement;

        before(() => {
            $unit = document.createElement('ce-children-unit');
            $unit.innerHTML = '<span class="child">child content</span>';
            document.body.append($unit);
        });

        after(() => $unit.remove());

        it('makes host children available as the `children` prop', () => {
            const $child = $unit.querySelector('.wrap .child');

            expect($child).to.not.equal(null);
            expect($child?.textContent).to.equal('child content');
        });
    });

    describe('fragment root', () => {
        const testText = 'Testing the fragment root...';
        let $unit: HTMLElement;

        before(() => {
            $unit = document.createElement('ce-fragment-unit');
            $unit.setAttribute('$value', testText);
            document.body.append($unit);
        });

        after(() => $unit.remove());

        it('mounts every root node of a `<>…</>` template, in order', () => {
            const roots = Array.from($unit.children);

            expect($unit.querySelector('h1.first')).to.be.instanceof(
                HTMLHeadingElement
            );
            expect($unit.querySelector('p.second')).to.be.instanceof(
                HTMLParagraphElement
            );
            // Order is the point — both roots mount, and they keep their
            // template order.
            expect(roots.map((el) => el.className)).to.deep.equal([
                'first',
                'second'
            ]);
        });
    });
});
