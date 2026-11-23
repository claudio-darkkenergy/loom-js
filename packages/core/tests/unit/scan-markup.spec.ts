import { expect } from '@esm-bundle/chai';

import {
    type MarkupState,
    scanMarkup
} from '../../src/lib/templating/scan-markup';

// Specs for the shared markup scan: state carries across token gaps, which
// sit after `statics[i]`.

const gapStates = (statics: string[]) => {
    const states: Omit<MarkupState, 'openTags'>[] = [];

    scanMarkup(statics, {
        gap: (_chunkIndex, { inComment, inTag, quote }) =>
            states.push({ inComment, inTag, quote })
    });

    return states;
};

describe('scanMarkup', () => {
    it('reports each gap’s position: text, open tag, quoted value, comment', () => {
        expect(
            gapStates([
                '<p>',
                '<a href="',
                '" x=',
                '>',
                '<!-- ',
                ' --></a></p>'
            ])
        ).to.deep.equal([
            { inComment: false, inTag: false, quote: null },
            { inComment: false, inTag: true, quote: '"' },
            { inComment: false, inTag: true, quote: null },
            { inComment: false, inTag: false, quote: null },
            { inComment: true, inTag: false, quote: null }
        ]);
    });

    it('reports start tags and tracks the open-element stack', () => {
        const starts: string[] = [];
        const stacks: string[][] = [];

        scanMarkup(['<div><br><SVG><path/>', '</svg>', '</div>'], {
            gap: (_chunkIndex, { openTags }) => stacks.push([...openTags]),
            startTag: (name) => starts.push(name)
        });

        expect(starts).to.deep.equal(['div', 'br', 'svg', 'path']);
        expect(stacks).to.deep.equal([['div', 'svg'], ['div']]);
    });
});
