import { expect } from '@esm-bundle/chai';

import { collapseWhitespace } from '../../src/lib/templating/collapse-whitespace';
import {
    ChildrenRegion,
    FormattedCode,
    RowPair,
    SlotPair
} from '../support/components/whitespace';
import { runSetup } from '../support/run-setup';

// Specs for the template whitespace collapse: a static whitespace run
// containing a newline is formatting, one without is authored content.
// Statics are written as plain arrays — the gap after `statics[i]` is an
// interpolation slot.

describe('collapseWhitespace', () => {
    describe('boundary runs', () => {
        it('should remove cross-line runs at the start and end of a child list', () => {
            expect(collapseWhitespace(['<p>\n    Hello\n</p>'])).to.deep.equal([
                '<p>Hello</p>'
            ]);
        });

        it('should remove cross-line runs around a sole slot child', () => {
            expect(
                collapseWhitespace(['<code>\n    ', '\n</code>'])
            ).to.deep.equal(['<code>', '</code>']);
        });

        it('should remove cross-line runs at the start and end of the template', () => {
            expect(
                collapseWhitespace(['\n    <div>', '</div>\n'])
            ).to.deep.equal(['<div>', '</div>']);
        });

        it('should empty an element holding only a cross-line run', () => {
            expect(collapseWhitespace(['<div>\n    </div>'])).to.deep.equal([
                '<div></div>'
            ]);
        });
    });

    describe('content runs', () => {
        it('should collapse a cross-line run between text to one space', () => {
            expect(
                collapseWhitespace(['<p>Hello\n        world</p>'])
            ).to.deep.equal(['<p>Hello world</p>']);
        });

        it('should collapse a cross-line run between sibling elements to one space', () => {
            expect(
                collapseWhitespace(['<p><b>a</b>\n    <i>b</i></p>'])
            ).to.deep.equal(['<p><b>a</b> <i>b</i></p>']);
        });

        it('should treat void and self-closed elements as content items', () => {
            expect(
                collapseWhitespace([
                    '<p>\n    a<br>\n    b\n    <img src="x" />\n    c\n</p>'
                ])
            ).to.deep.equal(['<p>a<br> b <img src="x" /> c</p>']);
        });

        it('should treat a comment as a content item', () => {
            expect(
                collapseWhitespace(['<p>a\n    <!-- note -->\n    b</p>'])
            ).to.deep.equal(['<p>a <!-- note --> b</p>']);
        });

        it('should collapse a run holding several newlines to one space', () => {
            expect(collapseWhitespace(['<p>a  \n\n\t  b</p>'])).to.deep.equal([
                '<p>a b</p>'
            ]);
        });
    });

    describe('same-line runs', () => {
        it('should preserve same-line spacing between text and elements', () => {
            expect(
                collapseWhitespace(['<p>Hello <b>world</b>  !</p>'])
            ).to.deep.equal(['<p>Hello <b>world</b>  !</p>']);
        });

        it('should preserve same-line boundary spacing', () => {
            expect(collapseWhitespace(['<span> ', ' </span>'])).to.deep.equal([
                '<span> ',
                ' </span>'
            ]);
        });

        it('should return the same statics when nothing spans a line', () => {
            const statics = ['<p class="a  b">', ' </p>'];

            expect(collapseWhitespace(statics)).to.equal(statics);
        });
    });

    describe('interpolation slots', () => {
        it('should keep one space between slots on separate lines', () => {
            expect(
                collapseWhitespace(['<span>\n    ', '\n    ', '\n</span>'])
            ).to.deep.equal(['<span>', ' ', '</span>']);
        });

        it('should keep one space between a slot and cross-line text', () => {
            expect(
                collapseWhitespace([
                    '<p>\n    Total:\n    ',
                    '\n    items\n</p>'
                ])
            ).to.deep.equal(['<p>Total: ', ' items</p>']);
        });

        it('should judge each side of a slot-split run on its own', () => {
            expect(collapseWhitespace(['<p>a \n', ' b</p>'])).to.deep.equal([
                '<p>a ',
                ' b</p>'
            ]);
        });

        it('should treat a top-level slot as a content item', () => {
            expect(
                collapseWhitespace(['\n    ', '\n    <p>x</p>\n'])
            ).to.deep.equal(['', ' <p>x</p>']);
        });
    });

    describe('tags', () => {
        it('should leave whitespace inside a tag untouched', () => {
            expect(
                collapseWhitespace([
                    '<div\n    class="a\n    b"\n    id="x"\n>\n    y\n</div>'
                ])
            ).to.deep.equal([
                '<div\n    class="a\n    b"\n    id="x"\n>y</div>'
            ]);
        });

        it('should leave whitespace around an attribute-value slot untouched', () => {
            expect(
                collapseWhitespace([
                    '<div\n    class=',
                    '\n    id="x"\n>\n    ',
                    '\n</div>'
                ])
            ).to.deep.equal(['<div\n    class=', '\n    id="x"\n>', '</div>']);
        });

        it('should treat a bare `<` as text', () => {
            expect(collapseWhitespace(['<p>a <\n    b</p>'])).to.deep.equal([
                '<p>a < b</p>'
            ]);
        });
    });

    describe('verbatim elements', () => {
        it('should preserve whitespace directly inside pre', () => {
            const statics = ['<pre>\n  line one\n    line two\n</pre>'];

            expect(collapseWhitespace(statics)).to.deep.equal(statics);
        });

        it('should preserve whitespace in pre descendants', () => {
            expect(
                collapseWhitespace([
                    '<div>\n    <pre><code>\n  a\n  <b>\n b\n</b>\n</code></pre>\n</div>'
                ])
            ).to.deep.equal([
                '<div><pre><code>\n  a\n  <b>\n b\n</b>\n</code></pre></div>'
            ]);
        });

        it('should preserve whitespace around slots inside pre', () => {
            expect(
                collapseWhitespace(['<pre>\n  ', '\n  ', '\n</pre>\n'])
            ).to.deep.equal(['<pre>\n  ', '\n  ', '\n</pre>']);
        });

        it('should preserve whitespace inside textarea', () => {
            expect(
                collapseWhitespace([
                    '<form>\n    <textarea>\n  a <b>\n  ',
                    '\n</textarea>\n</form>'
                ])
            ).to.deep.equal([
                '<form><textarea>\n  a <b>\n  ',
                '\n</textarea></form>'
            ]);
        });

        it('should preserve whitespace inside script and style', () => {
            expect(
                collapseWhitespace([
                    '<div>\n    <style>\n  a > b {\n    color: red;\n  }\n</style>\n    <script>\n  // note\n  if (a < b) {}\n</script>\n</div>'
                ])
            ).to.deep.equal([
                '<div><style>\n  a > b {\n    color: red;\n  }\n</style> <script>\n  // note\n  if (a < b) {}\n</script></div>'
            ]);
        });

        it('should resume collapsing after a verbatim element closes', () => {
            expect(
                collapseWhitespace(['<div><pre>\n a\n</pre>\n    b\n</div>'])
            ).to.deep.equal(['<div><pre>\n a\n</pre> b</div>']);
        });
    });
});

describe('template whitespace collapsing', () => {
    it('should render only the interpolated content of a formatted element', async () => {
        const $root = await runSetup({
            containerProps: {
                componentProps: { value: 'npm i' },
                TestComponent: FormattedCode
            }
        });

        expect($root.querySelector('code')?.textContent).to.equal('npm i');
    });

    it('should render one space between slots on separate lines', async () => {
        const $root = await runSetup({
            containerProps: {
                componentProps: { value: ['one', 'two'] },
                TestComponent: SlotPair
            }
        });

        expect($root.querySelector('span')?.textContent).to.equal('one two');
    });

    it('should collapse a component element children region', async () => {
        const $root = await runSetup({
            containerProps: { TestComponent: ChildrenRegion }
        });

        expect($root.querySelector('p')?.innerHTML).to.equal(
            '<em>wrapped text</em>'
        );
    });

    it('should keep table-content slots in place as content items', async () => {
        const $root = await runSetup({
            containerProps: {
                componentProps: { value: ['a', 'b'] },
                TestComponent: RowPair
            }
        });
        const $body = $root.querySelector('tbody');

        expect($body?.querySelectorAll('tr').length).to.equal(2);
        expect($body?.textContent).to.equal('a b');
        expect($root.querySelector('table')?.previousSibling).to.equal(null);
    });
});
