// Server/client parity for the template whitespace collapse: the same
// whitespace-heavy template serializes identically through `renderToString`
// (the browser stands in for the server runtime) and a browser `init`, and
// hydrating the served markup corrects nothing.
import { expect } from '@esm-bundle/chai';

import { hydrate } from '../../src';
import { renderToString } from '../../src/server';
import { WhitespaceHeavy } from '../support/components/whitespace';
import { runSetup } from '../support/run-setup';
import { createServerWindow } from '../support/server-window';

const EXPECTED_MARKUP =
    '<article>' +
    '<h1>Hello <b>world</b></h1> ' +
    '<p>Total: 3 items</p> ' +
    '<pre>  kept\n    3\n</pre> ' +
    '<span> 3 </span>' +
    '</article>';

describe('template whitespace collapsing parity', () => {
    it('should serialize collapsed markup on the server', async () => {
        const serverMarkup = await renderToString(
            WhitespaceHeavy({ value: 3 }),
            { window: createServerWindow() }
        );

        expect(serverMarkup).to.equal(EXPECTED_MARKUP);
    });

    it('should render the same markup in the browser as on the server', async () => {
        const serverMarkup = await renderToString(
            WhitespaceHeavy({ value: 3 }),
            { window: createServerWindow() }
        );
        const $root = await runSetup({
            containerProps: {
                componentProps: { value: 3 },
                TestComponent: WhitespaceHeavy
            }
        });

        expect($root.querySelector('article')?.outerHTML).to.equal(
            serverMarkup
        );
    });

    it('should hydrate served markup with no correcting mutations', async () => {
        const serverMarkup = await renderToString(
            WhitespaceHeavy({ value: 3 }),
            { window: createServerWindow() }
        );
        const root = document.createElement('div');

        root.innerHTML = serverMarkup;
        document.body.append(root);

        const rootObserver = new MutationObserver(() => undefined);

        rootObserver.observe(root, {
            characterData: true,
            childList: true,
            subtree: true
        });

        await hydrate({ app: WhitespaceHeavy({ value: 3 }), root });

        const records = rootObserver.takeRecords();

        rootObserver.disconnect();
        expect(root.innerHTML).to.equal(serverMarkup);
        // The single swap is the only mutation — nothing inside the tree is
        // corrected afterwards.
        expect(
            records.filter((record) => record.target !== root)
        ).to.deep.equal([]);
        root.remove();
    });
});
