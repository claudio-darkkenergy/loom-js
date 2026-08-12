import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { component, el } from '../../../src';
import { activity } from '../../../src/activity';
import { runSetup } from '../../support/run-setup';

// Specs for the `el(tagName)` factory (`add-core-element-components`
// design Decision 2): plain HTML tags as memoized component values.

describe('el(tagName)', () => {
    it('should render the named tag with attrs, listeners, class, and children', async () => {
        const onClick = sinon.fake();
        const TestComponent = component(
            (html) => html`
                <main>
                    ${el('footer')({
                        attrs: { 'data-kind': 'colophon' },
                        children: 'fine print',
                        className: 'foot',
                        id: 'colophon-1',
                        on: { click: onClick },
                        style: 'color: red'
                    })}
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $footer = $test.querySelector('footer');

        expect($footer, 'footer rendered').to.exist;
        expect($footer?.getAttribute('data-kind')).to.equal('colophon');
        expect($footer?.classList.contains('foot')).to.be.true;
        expect($footer?.id).to.equal('colophon-1');
        expect($footer?.getAttribute('style')).to.contain('color: red');
        expect($footer?.textContent).to.contain('fine print');

        $footer?.dispatchEvent(new Event('click'));
        expect(onClick.calledOnce, 'listener wired').to.be.true;
    });

    it('should memoize per tag name, case-insensitively', () => {
        expect(el('footer')).to.equal(el('footer'));
        expect(el('Footer'), 'tag names are case-insensitive').to.equal(
            el('footer')
        );
        expect(el('footer')).to.not.equal(el('nav'));
    });

    it('should reuse DOM nodes across re-renders', async () => {
        const label = activity('before');
        const TestComponent = component(
            (html) => html`
                <main>
                    ${label.effect(({ value }) =>
                        el('div')({ children: value, className: 'reused' })
                    )}
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $before = $test.querySelector('.reused');

        expect($before, 'div rendered').to.exist;
        expect($before?.textContent).to.contain('before');

        label.update('after');

        const $after = $test.querySelector('.reused');
        expect($after?.textContent).to.contain('after');
        expect($after, 'same node reused').to.equal($before);
    });

    it('should render void tags childless', async () => {
        const TestComponent = component(
            (html) => html`
                <main>${el('img')({ attrs: { alt: 'spacer' } })}</main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $img = $test.querySelector('img');

        expect($img, 'img rendered').to.exist;
        expect($img?.getAttribute('alt')).to.equal('spacer');
        expect($img?.childNodes.length).to.equal(0);
    });

    it('should compose via element syntax as an interpolated tag', async () => {
        const TestComponent = component(
            (html) => html`
                <main><${el('section')} className="sec">content</></main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $section = $test.querySelector('section.sec');

        expect($section, 'section rendered').to.exist;
        expect($section?.textContent).to.contain('content');
    });
});
