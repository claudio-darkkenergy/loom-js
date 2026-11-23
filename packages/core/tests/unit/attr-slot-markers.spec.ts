import { expect } from '@esm-bundle/chai';

import { config } from '../../src/config';
import {
    attrMarker,
    joinStatics,
    readAttrMarker,
    readAttrTail,
    scanAttrSlots
} from '../../src/lib/templating/attr-slot-markers';

// Specs for the attribute-slot reading `htmlParser` does before parsing:
// token gap `i` sits after `statics[i]`.

const TOKEN = config.TOKEN;

describe('attr slot markers', () => {
    describe('readAttrTail', () => {
        it('reads an unquoted attribute tail', () => {
            expect(readAttrTail('<rect x=')).to.deep.equal({
                name: 'x',
                quote: '',
                start: 6
            });
        });

        it('reads a quoted attribute tail, either quote', () => {
            expect(readAttrTail('<svg viewBox="')).to.deep.equal({
                name: 'viewBox',
                quote: '"',
                start: 5
            });
            expect(readAttrTail(" d='")).to.include({ name: 'd', quote: "'" });
        });

        it('reads `$`-prefixed and namespaced names', () => {
            expect(readAttrTail('<button $click=')?.name).to.equal('$click');
            expect(readAttrTail('<use xlink:href="')?.name).to.equal(
                'xlink:href'
            );
        });

        it('reads around whitespace at `=` and after a closing quote', () => {
            expect(readAttrTail('<p title = ')?.name).to.equal('title');
            expect(readAttrTail('" y="')).to.deep.equal({
                name: 'y',
                quote: '"',
                start: 2
            });
        });

        it('reads nothing from a tail that is not `name=`', () => {
            expect(readAttrTail('<p>Hello ')).to.be.null;
            expect(readAttrTail('<p class="a ')).to.be.null;
            expect(readAttrTail('=')).to.be.null;
        });
    });

    describe('scanAttrSlots', () => {
        it('finds whole-value attribute gaps, quoted or not', () => {
            const slots = scanAttrSlots([
                '<svg viewBox="',
                '"><rect x=',
                ' width=',
                '/></svg>'
            ]);

            expect(
                [...slots].map(([gap, { name }]) => [gap, name])
            ).to.deep.equal([
                [0, 'viewBox'],
                [1, 'x'],
                [2, 'width']
            ]);
        });

        it('skips text that ends in `=`', () => {
            expect(scanAttrSlots(['<p>a=', '</p>']).size).to.equal(0);
        });

        it('skips part of a value', () => {
            expect(scanAttrSlots(['<p class="a ', '"></p>']).size).to.equal(0);
            expect(scanAttrSlots(['<p class="', ' b"></p>']).size).to.equal(0);
            expect(scanAttrSlots(['<p width=', 'px></p>']).size).to.equal(0);
        });

        it('skips `name=` written inside another quoted value', () => {
            expect(
                scanAttrSlots(['<p title="a x="', '">', '</p>']).size
            ).to.equal(0);
        });

        it('skips `name=` inside a comment', () => {
            expect(scanAttrSlots(['<!-- x=', ' --><p></p>']).size).to.equal(0);
        });
    });

    describe('joinStatics', () => {
        it('writes attribute slots as markers and other gaps as given', () => {
            const statics = ['<p class="', '" title=', '>', '</p>'];

            expect(
                joinStatics(statics, scanAttrSlots(statics), () => TOKEN)
            ).to.equal(`<p ${attrMarker(0)}  ${attrMarker(1)} >${TOKEN}</p>`);
        });

        it('separates a marker from an attribute that follows its quote', () => {
            const statics = ['<p a="', '"b="', '"></p>'];

            expect(
                joinStatics(statics, scanAttrSlots(statics), () => TOKEN)
            ).to.equal(`<p ${attrMarker(0)} ${attrMarker(1)} ></p>`);
        });
    });

    describe('readAttrMarker', () => {
        it('reads a marker’s gap', () => {
            expect(readAttrMarker(attrMarker(12))).to.equal(12);
        });

        it('names markers in ASCII', () => {
            expect(attrMarker(3)).to.match(/^[a-z0-9-]+$/);
        });

        it('returns -1 for any other name', () => {
            expect(readAttrMarker('class')).to.equal(-1);
            expect(readAttrMarker(TOKEN)).to.equal(-1);
            expect(readAttrMarker(`${attrMarker(1)}x`)).to.equal(-1);
        });
    });
});
