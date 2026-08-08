import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { compileComponentTags } from '../../../src/lib/templating/compile-component-tags';
import type { TemplateTagValue } from '../../../src/types';

// Plan-shape unit specs for `add-template-component-syntax` — the transform's
// cached output: derived chunks plus one getter per derived slot.

describe('compileComponentTags — plan shape', () => {
    let renderFake: ReturnType<typeof sinon.fake.returns>;

    beforeEach(() => {
        renderFake = sinon.fake.returns('rendered');
    });

    it('should compile a self-closing component tag with no props', () => {
        const plan = compileComponentTags(['<', '/>']);

        expect(plan).to.not.equal(null);
        expect(plan?.getters).to.have.length(1);

        const result = plan?.getters[0]?.([renderFake]);

        expect(renderFake.calledOnce, 'component called').to.be.true;
        expect(renderFake.firstCall.args[0]).to.deep.equal({});
        expect(result).to.equal('rendered');
    });

    it('should mark a component-only template as a rootless fragment', () => {
        const plan = compileComponentTags(['<', '/>']);

        expect(plan?.chunks[0]?.trimStart().startsWith('<>')).to.be.true;
    });

    it('should preserve surrounding markup and compile the tag into a slot', () => {
        const plan = compileComponentTags(['<main><', '/></main>']);

        expect(plan?.chunks).to.deep.equal(['<main>', '</main>']);
        expect(plan?.getters).to.have.length(1);
    });

    it('should compile interpolated props as JS values by reference', () => {
        const onClick = () => {};
        const plan = compileComponentTags(['<', ' label=', ' onClick=', '/>']);

        plan?.getters[0]?.([renderFake, 'Click', onClick]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({
            label: 'Click',
            onClick
        });
        expect(renderFake.firstCall.args[0].onClick, 'by reference').to.equal(
            onClick
        );
    });

    it('should compile boolean shorthand and quoted static strings', () => {
        const plan = compileComponentTags([
            '<',
            ' isOnlyIcon icon=\'icon-menu\' title="He said"/>'
        ]);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({
            icon: 'icon-menu',
            isOnlyIcon: true,
            title: 'He said'
        });
    });

    it('should keep prop names verbatim — no lowercasing', () => {
        const plan = compileComponentTags(['<', ' onClick=', '/>']);

        plan?.getters[0]?.([renderFake, 'x']);

        expect(Object.keys(renderFake.firstCall.args[0])).to.deep.equal([
            'onClick'
        ]);
    });

    it('should let a duplicate prop name win last, like an object literal', () => {
        const plan = compileComponentTags(['<', ' a="1" a="2"/>']);

        plan?.getters[0]?.([renderFake]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({ a: '2' });
    });

    it('should pass `key` through as an ordinary prop', () => {
        const plan = compileComponentTags(['<', ' key=', '/>']);

        plan?.getters[0]?.([renderFake, 'k7']);

        expect(renderFake.firstCall.args[0]).to.deep.equal({ key: 'k7' });
    });

    it('should keep pass-through interpolations pass-through', () => {
        const plan = compileComponentTags(['<main>', ' <', '/></main>']);
        const text: TemplateTagValue = 'hello';

        expect(plan?.chunks).to.deep.equal(['<main>', ' ', '</main>']);
        expect(plan?.getters[0]?.([text, renderFake])).to.equal(text);
    });

    it('should compile children into a synthesized component, not raw markup', () => {
        const plan = compileComponentTags(['<main><', '><b>hi</b></></main>']);

        plan?.getters[0]?.([renderFake]);

        const props = renderFake.firstCall.args[0];
        expect(typeof props.children, 'children is a ContextFunction').to.equal(
            'function'
        );
    });

    it('should not throw a `</>` error for a quoted static value containing no interpolation', () => {
        const plan = compileComponentTags(['<', ' a="b" x=', '/>']);

        plan?.getters[0]?.([renderFake, 1]);

        expect(renderFake.firstCall.args[0]).to.deep.equal({
            a: 'b',
            x: 1
        });
    });
});
