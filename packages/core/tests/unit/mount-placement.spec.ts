import { expect } from '@esm-bundle/chai';

import { component, init } from '../../src';
import type { AppInitProps } from '../../src';

// Specs for `init`'s mount placement (`core-api-follow-ups` design Decision
// 1): the app node's position relative to the root's existing children is a
// placement mode — `'replace'` (the default), `'append'`, or `'prepend'`.

const PlacedApp = component(
    (html) => html`
        <div class="placed-app">app content</div>
    `
);

const makeRootWithChild = () => {
    const root = document.createElement('div');
    const existingChild = document.createElement('span');

    existingChild.className = 'existing-child';
    root.append(existingChild);
    document.body.append(root);

    return root;
};

const runInit = (root: Element, placement?: AppInitProps['placement']) =>
    new Promise<Element>((resolve) => {
        init({
            app: PlacedApp(),
            onAppMounted: resolve,
            placement,
            root
        });
    });

describe('mount placement', () => {
    const roots: Element[] = [];

    after(() => {
        roots.forEach((root) => root.remove());
    });

    it('replaces the root children by default', async () => {
        const root = makeRootWithChild();

        roots.push(root);
        await runInit(root);

        expect(root.children.length).to.equal(1);
        expect(root.children[0]?.className).to.equal('placed-app');
    });

    it('appends after the existing children with `append`', async () => {
        const root = makeRootWithChild();

        roots.push(root);
        await runInit(root, 'append');

        expect(root.children.length).to.equal(2);
        expect(root.children[0]?.className).to.equal('existing-child');
        expect(root.children[1]?.className).to.equal('placed-app');
    });

    it('prepends before the existing children with `prepend`', async () => {
        const root = makeRootWithChild();

        roots.push(root);
        await runInit(root, 'prepend');

        expect(root.children.length).to.equal(2);
        expect(root.children[0]?.className).to.equal('placed-app');
        expect(root.children[1]?.className).to.equal('existing-child');
    });
});
