import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { compileComponentTags } from '../../../src/lib/templating/compile-component-tags';

// Slot-grouping unit specs for `add-named-slots` (its design.md Decisions
// 3, 4): labelled top-level nodes compile into `props.slots` regions, and
// labels outside the accepted grammar throw at transform time.

describe('compileComponentTags — slot grouping', () => {
    let renderFake: ReturnType<typeof sinon.fake.returns>;

    beforeEach(() => {
        renderFake = sinon.fake.returns('rendered');
    });

    it('should group labelled top-level elements into `props.slots` regions', () => {
        const plan = compileComponentTags([
            '<main><',
            '><h2 slot="header">T</h2><p>b</p><b slot="footer">f</b></></main>'
        ]);

        plan?.getters[0]?.([renderFake]);

        const props = renderFake.firstCall.args[0];

        expect(
            typeof props.slots?.header,
            'header region is a ContextFunction'
        ).to.equal('function');
        expect(
            typeof props.slots?.footer,
            'footer region is a ContextFunction'
        ).to.equal('function');
        expect(
            typeof props.children,
            'unlabelled remainder stays children'
        ).to.equal('function');
    });

    it('should add no `slots` key for a label-free children region', () => {
        const plan = compileComponentTags(['<main><', '><p>b</p></></main>']);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.not.have.property('slots');
    });

    it('should consume a static `slot` prop on a top-level component element as the region label', () => {
        const inner = sinon.fake.returns('inner');
        const plan = compileComponentTags([
            '<main><',
            '><',
            ' slot="col" a="1"/></></main>'
        ]);

        plan?.getters[0]?.([renderFake, inner]);

        const props = renderFake.firstCall.args[0];

        expect(typeof props.slots?.col, 'region compiled').to.equal('function');
        expect(inner.calledOnce, 'inner component compiled').to.be.true;
        expect(
            inner.firstCall.args[0],
            'the `slot` label is addressing, not a prop'
        ).to.deep.equal({ a: '1' });
    });

    it('should route a labelled component element with children through its `</>` close', () => {
        const inner = sinon.fake.returns('inner');
        const plan = compileComponentTags([
            '<main><',
            '><',
            ' slot="col">x</></></main>'
        ]);

        plan?.getters[0]?.([renderFake, inner]);

        const props = renderFake.firstCall.args[0];

        expect(typeof props.slots?.col, 'region compiled').to.equal('function');
        expect(inner.calledOnce, 'inner component compiled').to.be.true;
        expect(
            typeof inner.firstCall.args[0].children,
            'inner children preserved'
        ).to.equal('function');
        expect(
            'slot' in inner.firstCall.args[0],
            'the `slot` label is addressing, not a prop'
        ).to.be.false;
    });

    it('should let markup-derived regions win over an explicit `slots=` prop', () => {
        const plan = compileComponentTags([
            '<main><',
            ' slots=',
            '><i slot="a">m</i></></main>'
        ]);

        plan?.getters[0]?.([renderFake, { a: 'fromProp' }]);

        expect(
            typeof renderFake.firstCall.args[0].slots?.a,
            'markup region replaced the prop value'
        ).to.equal('function');
    });

    it('should not read a `slot=` substring inside another attribute value as a label', () => {
        const plan = compileComponentTags([
            '<main><',
            '><span title="slot=nope">a</span></></main>'
        ]);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.not.have.property('slots');
    });

    it('should pass a nested `slot` attribute through untouched — no label, no throw', () => {
        const plan = compileComponentTags([
            '<main><',
            '><div><span slot="x">a</span></div></></main>'
        ]);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.not.have.property('slots');
    });

    it('should leave a `slot` attribute outside any children region untouched', () => {
        const plan = compileComponentTags([
            '<main><span slot="x">a</span><',
            '/></main>'
        ]);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({});
    });
});

describe('compileComponentTags — slot-label throws', () => {
    it('should throw on an interpolated label on a plain element', () => {
        expect(() =>
            compileComponentTags([
                '<main><',
                '><span slot=',
                '>a</span></></main>'
            ])
        ).to.throw(Error, 'slot label');
    });

    it('should throw on an interpolated label on a top-level component element', () => {
        expect(() =>
            compileComponentTags(['<main><', '><', ' slot=', '/></></main>'])
        ).to.throw(Error, 'slot label');
    });

    it('should throw on a valueless `slot`', () => {
        expect(() =>
            compileComponentTags(['<main><', '><span slot>a</span></></main>'])
        ).to.throw(Error, 'slot label');
    });

    it('should throw on an unquoted label', () => {
        expect(() =>
            compileComponentTags([
                '<main><',
                '><span slot=x>a</span></></main>'
            ])
        ).to.throw(Error, 'slot label');
    });

    it('should throw on an empty label', () => {
        expect(() =>
            compileComponentTags([
                '<main><',
                '><span slot="">a</span></></main>'
            ])
        ).to.throw(Error, 'slot label');
    });
});
