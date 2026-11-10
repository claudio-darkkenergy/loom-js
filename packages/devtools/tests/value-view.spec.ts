import { expect } from '@esm-bundle/chai';

import { previewOf } from '../src/frontend/views/value-view';

// Specs for `devtools-inspector`'s value previews: a component value reads
// as an element, without doubling a tag its name already carries.

describe('devtools value previews', () => {
    it('shows a named component value as a self-closing element', () => {
        expect(previewOf({ name: 'Card', t: 'component' })).to.equal(
            '<Card />'
        );
    });

    it('shows a name that already carries a tag as it is', () => {
        expect(previewOf({ name: '<ul>', t: 'component' })).to.equal('<ul>');
        expect(
            previewOf({ name: 'Toggle <x-toggle>', t: 'component' })
        ).to.equal('Toggle <x-toggle>');
    });
});
