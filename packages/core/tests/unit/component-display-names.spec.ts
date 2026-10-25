import { expect } from '@esm-bundle/chai';

import { component, defineElement, el } from '../../src';
import {
    displayNameOf,
    findOwnerContext,
    nameComponent
} from '../../src/devtools';
import { runSetup } from '../support/run-setup';

// Specs for the `component-display-names` capability: the `name` option,
// injected names (the build tool's `nameComponent` call), explicit-wins
// precedence, the element tag fallback, and `Anonymous`.

const nameOfRendered = ($root: HTMLElement, selector: string) =>
    displayNameOf(findOwnerContext($root.querySelector(selector)!)!);

describe('component display names', () => {
    it('reports an explicit name', async () => {
        const Probe = component(
            (html) => html`
                <p data-probe>card</p>
            `,
            {
                name: 'Probe'
            }
        );
        const $test = await runSetup({
            containerProps: { TestComponent: Probe }
        });

        expect(nameOfRendered($test, '[data-probe]')).to.equal('Probe');
    });

    it('renders identical DOM with and without a name', async () => {
        const template = (html: any) => html`
            <p data-same>same</p>
        `;
        const $named = await runSetup({
            containerProps: {
                TestComponent: component(template, { name: 'Named' })
            }
        });
        const $unnamed = await runSetup({
            containerProps: { TestComponent: component(template) }
        });

        expect($named.innerHTML).to.equal($unnamed.innerHTML);
    });

    it('names a component from an injected binding name', async () => {
        const Injected = component(
            (html) => html`
                <p data-injected>i</p>
            `
        );

        nameComponent(Injected, 'Injected');

        const $test = await runSetup({
            containerProps: { TestComponent: Injected }
        });

        expect(nameOfRendered($test, '[data-injected]')).to.equal('Injected');
    });

    it('keeps an explicit name over an injected one', async () => {
        const Card = component(
            (html) => html`
                <p data-explicit>c</p>
            `,
            {
                name: 'ProductCard'
            }
        );

        nameComponent(Card, 'Card');

        const $test = await runSetup({
            containerProps: { TestComponent: Card }
        });

        expect(nameOfRendered($test, '[data-explicit]')).to.equal(
            'ProductCard'
        );
    });

    it('ignores an injected name for something that is not a component', () => {
        expect(() => nameComponent({}, 'Nope')).to.not.throw();
        expect(() => nameComponent(undefined, 'Nope')).to.not.throw();
    });

    it('falls back to the tag for an unnamed element and pairs it with a name', async () => {
        const Unnamed = defineElement(
            'names-unnamed-el',
            (html) => html`
                <p data-unnamed-el>u</p>
            `
        );
        const Named = defineElement(
            'names-named-el',
            (html) => html`
                <p data-named-el>n</p>
            `
        );

        nameComponent(Named, 'NamedEl');

        const $unnamed = await runSetup({
            containerProps: { TestComponent: Unnamed }
        });
        const $named = await runSetup({
            containerProps: { TestComponent: Named }
        });

        expect(nameOfRendered($unnamed, '[data-unnamed-el]')).to.equal(
            '<names-unnamed-el>'
        );
        expect(nameOfRendered($named, '[data-named-el]')).to.equal(
            'NamedEl <names-named-el>'
        );
    });

    it("names core's own components", async () => {
        const $test = await runSetup({
            containerProps: {
                TestComponent: () =>
                    el('section')({
                        attrs: { 'data-el-section': 'yes' },
                        children: 'tag'
                    })
            }
        });

        expect(nameOfRendered($test, '[data-el-section]')).to.equal(
            '<section>'
        );
    });

    it('reports an unnamed component as Anonymous', async () => {
        const $test = await runSetup({
            containerProps: {
                TestComponent: component(
                    (html) => html`
                        <p data-anon>a</p>
                    `
                )
            }
        });

        expect(nameOfRendered($test, '[data-anon]')).to.equal('Anonymous');
    });
});
