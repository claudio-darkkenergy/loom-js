import { component } from '../../src';
import { expect } from '@esm-bundle/chai';

interface CustomElementProps {
    value: string;
}

// The template function must be *named* — `registerCustomElement` derives the
// element name from `templateFunction.name` and bails when it is empty.
component<CustomElementProps>(function CustomElementUnit(html, { value }) {
    return html`
        <p class="custom-element-unit">${value}</p>
    `;
});

describe('custom element', () => {
    const elementName = 'custom-element-unit';
    const testText = 'Testing the custom element...';
    let $unit: HTMLElement;

    before(() => {
        $unit = document.createElement(elementName);
        $unit.setAttribute('$value', testText);
        document.body.append($unit);
    });

    after(() => $unit.remove());

    it('registers the component as a custom element', () => {
        expect(window.customElements.get(elementName)).to.not.equal(undefined);
        expect($unit).to.not.be.instanceof(HTMLUnknownElement);
    });

    it('renders the component into an open shadow root', () => {
        const $rendered = $unit.shadowRoot?.querySelector('p');

        expect($unit.shadowRoot).to.not.equal(null);
        expect($rendered).to.be.instanceof(HTMLParagraphElement);
    });

    it('maps `$`-prefixed attributes to camelCase component props', () => {
        const $rendered = $unit.shadowRoot?.querySelector('p');

        expect($rendered?.textContent?.trim()).to.equal(testText);
    });
});
