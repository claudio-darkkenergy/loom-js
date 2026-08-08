import { expect } from '@esm-bundle/chai';

import { compileComponentTags } from '../../../src/lib/templating/compile-component-tags';

// The fast bail-out (parent change task 2.4): templates without a
// component-tag signal are never scanned, keeping the hot path byte-identical.

describe('compileComponentTags — no-op guard', () => {
    it('should return null for a template with no interpolations', () => {
        expect(compileComponentTags(['<div>hi</div>'])).to.equal(null);
    });

    it('should return null for ordinary interpolations', () => {
        expect(compileComponentTags(['<div>', '</div>'])).to.equal(null);
    });

    it('should return null when `<` is not adjacent to the interpolation', () => {
        expect(compileComponentTags(['<p>a < ', '</p>'])).to.equal(null);
    });

    it('should return null for stray `</>` text when no component signal exists', () => {
        // The native parser silently drops `</>` today; without a
        // component signal the transform must not even scan.
        expect(compileComponentTags(['<div></></div>'])).to.equal(null);
    });
});
