import { expect } from '@esm-bundle/chai';

import { scanTableScope } from '../../src/lib/templating/table-scope';

// Specs for the `table-scope` scanner (`table-aware-template-parsing`
// design Decision 1): tag- and attribute-boundary-aware classification of a
// template's statics — token gap `i` sits after `statics[i]`.

describe('scanTableScope', () => {
    it('takes the no-table fast path for table-free statics', () => {
        const scope = scanTableScope(['<div><p>', '</p></div>']);

        expect(scope.hasTableMarkup).to.be.false;
        expect(scope.rootIsTablePart).to.be.false;
        expect(scope.tableContentTokens.size).to.equal(0);
    });

    it('does not sniff table tags out of longer tag names', () => {
        const scope = scanTableScope([
            '<column-chart><thumbnail-strip>',
            '</thumbnail-strip></column-chart>'
        ]);

        expect(scope.hasTableMarkup).to.be.false;
    });

    it('reports a table-part root', () => {
        const scope = scanTableScope(['<tr><td>', '</td></tr>']);

        expect(scope.hasTableMarkup).to.be.true;
        expect(scope.rootIsTablePart).to.be.true;
    });

    it('reports a non-part root around table markup', () => {
        const scope = scanTableScope([
            '<div><table><tbody>',
            '</tbody></table></div>'
        ]);

        expect(scope.hasTableMarkup).to.be.true;
        expect(scope.rootIsTablePart).to.be.false;
        expect(Array.from(scope.tableContentTokens)).to.deep.equal([0]);
    });

    it('marks tokens directly inside table, sections, tr, and colgroup', () => {
        const scope = scanTableScope([
            '<table>',
            '<thead>',
            '</thead><tbody><tr>',
            '</tr></tbody><colgroup>',
            '</colgroup></table>'
        ]);

        expect(Array.from(scope.tableContentTokens)).to.deep.equal([
            0, 1, 2, 3
        ]);
    });

    it('leaves tokens inside td, th, and caption interiors alone', () => {
        const scope = scanTableScope([
            '<table><caption>',
            '</caption><tbody><tr><td>',
            '</td><th>',
            '</th></tr></tbody></table>'
        ]);

        expect(scope.hasTableMarkup).to.be.true;
        expect(scope.tableContentTokens.size).to.equal(0);
    });

    it('leaves attribute-value tokens on table parts alone', () => {
        const scope = scanTableScope([
            '<table><tbody><tr class=',
            '><td data-kind=',
            '>x</td></tr></tbody></table>'
        ]);

        expect(scope.tableContentTokens.size).to.equal(0);
    });

    it('survives a quoted `>` in an attribute value', () => {
        const scope = scanTableScope([
            '<table data-note="a>b"><tbody>',
            '</tbody></table>'
        ]);

        expect(Array.from(scope.tableContentTokens)).to.deep.equal([0]);
    });

    it('scopes nested tables independently', () => {
        const scope = scanTableScope([
            // Token 0: inside the inner tbody (content). Token 1: back inside
            // the outer td (text-allowing).
            '<table><tbody><tr><td><table><tbody>',
            '</tbody></table>',
            '</td></tr></tbody></table>'
        ]);

        expect(Array.from(scope.tableContentTokens)).to.deep.equal([0]);
    });

    it('keeps the stack honest over implied td/tr closes', () => {
        const scope = scanTableScope([
            '<table><tbody><tr><td>a<td>b<tr>',
            '</tbody></table>'
        ]);

        // The second `<tr>` implies the open cell and row closed — the token
        // sits in row content.
        expect(Array.from(scope.tableContentTokens)).to.deep.equal([0]);
    });

    it('ignores tokens inside authored HTML comments', () => {
        const scope = scanTableScope([
            '<table><tbody><!-- note: ',
            ' --><tr><td>x</td></tr></tbody></table>'
        ]);

        expect(scope.tableContentTokens.size).to.equal(0);
    });
});
