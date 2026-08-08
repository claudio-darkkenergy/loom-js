import { expect } from '@esm-bundle/chai';

import { compileComponentTags } from '../../../src/lib/templating/compile-component-tags';

// Grammar throws for `add-template-component-syntax` (its design.md
// Decisions 5, 6, 8, 9): malformed component syntax fails at transform time.

describe('compileComponentTags — throws', () => {
    it('should throw on the named closing form `</${Component}>`', () => {
        expect(() =>
            compileComponentTags(['<div><', '></', '></div>'])
        ).to.throw(Error, 'not an accepted closing form');
    });

    it('should throw on the `<//>` closing form', () => {
        expect(() => compileComponentTags(['<div><', '><//></div>'])).to.throw(
            Error,
            'not an accepted closing form'
        );
    });

    it('should throw on `</>` with no open component element', () => {
        expect(() => compileComponentTags(['<div></> <', '/></div>'])).to.throw(
            Error,
            'no component element is open'
        );
    });

    it('should throw on an unclosed component element', () => {
        expect(() => compileComponentTags(['<div><', '>oops</div>'])).to.throw(
            Error,
            'unclosed component element'
        );
    });

    it('should throw on a `$`-prefixed prop, suggesting the unprefixed name', () => {
        expect(() => compileComponentTags(['<', ' $onClick=', '/>'])).to.throw(
            Error,
            'onClick'
        );
    });

    it('should throw on an unquoted static value', () => {
        expect(() => compileComponentTags(['<', ' a=b/>'])).to.throw(
            Error,
            'unquoted'
        );
    });

    it('should throw on an interpolation inside a quoted value', () => {
        expect(() => compileComponentTags(['<', ' a="x ', '"/>'])).to.throw(
            Error,
            'within the same chunk'
        );
    });

    it('should throw on an interpolation that is not immediately after `name=`', () => {
        expect(() => compileComponentTags(['<', ' ', '=', '/>'])).to.throw(
            Error,
            'interpolation'
        );
    });

    it('should throw when the tag interpolation is not followed by whitespace, `/>`, or `>`', () => {
        expect(() => compileComponentTags(['<', 'icon="x"/>'])).to.throw(
            Error,
            'followed by'
        );
    });

    it('should throw at render time when the tag value is not callable', () => {
        const plan = compileComponentTags(['<', '/>']);

        expect(() => plan?.getters[0]?.(['not a component'])).to.throw(
            Error,
            'not callable'
        );
    });
});
