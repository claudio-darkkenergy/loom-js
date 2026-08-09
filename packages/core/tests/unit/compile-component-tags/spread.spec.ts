import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { compileComponentTags } from '../../../src/lib/templating/compile-component-tags';

// Spread-prop unit specs for `add-spread-props` — `...${object}` in a
// component element's attribute region joins the ordered props application
// with JS object-spread semantics (its design.md Decisions 1–4).

describe('compileComponentTags — spread props', () => {
    let renderFake: ReturnType<typeof sinon.fake.returns>;

    beforeEach(() => {
        renderFake = sinon.fake.returns('rendered');
    });

    it('should spread an interpolated object into the props', () => {
        const plan = compileComponentTags(['<', ' ...', '/>']);

        plan?.getters[0]?.([
            renderFake,
            { icon: 'icon-menu', isOnlyIcon: true }
        ]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({
            icon: 'icon-menu',
            isOnlyIcon: true
        });
    });

    it('should apply spreads and named props in source order, last wins', () => {
        const plan = compileComponentTags(['<', ' a=', ' ...', ' b=', '/>']);

        plan?.getters[0]?.([
            renderFake,
            'named-a',
            { a: 'spread-a', b: 'spread-b' },
            'named-b'
        ]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({
            a: 'spread-a',
            b: 'named-b'
        });
    });

    it('should treat nullish and non-object spread values as a no-op', () => {
        const plan = compileComponentTags(['<', ' ...', '/>']);

        for (const value of [null, undefined, 5, true]) {
            const tagFake = sinon.fake.returns('rendered');

            plan?.getters[0]?.([tagFake, value]);

            expect(
                tagFake.firstCall.args[0],
                `spreading ${value}`
            ).to.deep.equal({});
        }
    });

    it('should keep a `slot` key arriving via spread an ordinary prop, not a label', () => {
        const outerFake = sinon.fake.returns('outer');
        const innerFake = sinon.fake.returns('inner');
        const plan = compileComponentTags([
            '<main><',
            '><',
            ' ...',
            '/></></main>'
        ]);

        plan?.getters[0]?.([outerFake, innerFake, { slot: 'header' }]);

        expect(innerFake.firstCall.args[0]).to.deep.equal({ slot: 'header' });
        expect(outerFake.firstCall.args[0].slots, 'no named region created').to
            .be.undefined;
    });

    it('should let markup children win over spread-supplied `children`', () => {
        const plan = compileComponentTags([
            '<main><',
            ' ...',
            '><b>hi</b></></main>'
        ]);

        plan?.getters[0]?.([renderFake, { children: 'stolen' }]);

        expect(
            typeof renderFake.firstCall.args[0].children,
            'markup children win'
        ).to.equal('function');
    });

    it('should let markup slots win over spread-supplied `slots`', () => {
        const plan = compileComponentTags([
            '<main><',
            ' ...',
            '><div slot="header">hi</div></></main>'
        ]);

        plan?.getters[0]?.([renderFake, { slots: 'stolen' }]);

        const slots = renderFake.firstCall.args[0].slots;

        expect(typeof slots, 'markup slots win').to.equal('object');
        expect(typeof slots.header).to.equal('function');
    });

    it('should throw when `...` is not immediately before an interpolation', () => {
        expect(() => compileComponentTags(['<', ' ...a=', '/>'])).to.throw(
            Error,
            'immediately precede'
        );
        expect(() => compileComponentTags(['<', ' ... ', '/>'])).to.throw(
            Error,
            'immediately precede'
        );
    });

    it('should throw on `...` at the end of the template', () => {
        expect(() => compileComponentTags(['<', ' ...'])).to.throw(
            Error,
            'unterminated'
        );
    });

    it('should require a separator after a spread interpolation', () => {
        expect(() => compileComponentTags(['<', ' ...', 'a="1"/>'])).to.throw(
            Error,
            'followed by'
        );
    });
});
