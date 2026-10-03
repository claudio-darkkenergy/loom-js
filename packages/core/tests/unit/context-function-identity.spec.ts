import { expect } from '@esm-bundle/chai';

import { component } from '../../src';
import { activity } from '../../src/activity';
import {
    appendChildContext,
    isActivityContextFunction,
    isContextFunction
} from '../../src/lib/context/helpers';
import type { ComponentContextPartial, ContextFunction } from '../../src/types';

type KeyedListFixture = typeof import('../support/minified/keyed-list');

// Served by `tests/support/minified-fixture-plugin.mjs`: the fixture and its
// own copy of core, bundled with esbuild `minify` and no `keepNames`.
const minifiedFixturePath = '/__minified__/keyed-list.js';
const loadMinifiedFixture = (): Promise<KeyedListFixture> =>
    import(minifiedFixturePath);

// What a minifier does to a context function: same object, new name.
const renamed = (fn: ContextFunction) =>
    Object.defineProperty(fn, 'name', { value: 'a' });

const Box = component<{ color?: string }>(
    (html, { color }) => html`
        <div data-color=${color}></div>
    `
);

describe('context-function identity', () => {
    describe('a minified consumer bundle', () => {
        it('should keep keyed items across a reorder', async () => {
            const { createdLabels, mount, update } =
                await loadMinifiedFixture();
            const host = document.createElement('div');

            document.body.prepend(host);

            const $app = await mount(host, ['a', 'b', 'c']);
            const itemOf = (label: string) =>
                $app.querySelector(`[data-item="${label}"]`);
            const aBefore = itemOf('a');
            const cBefore = itemOf('c');

            expect(aBefore, 'a rendered').to.exist;
            expect(createdLabels(), 'one creation per item').to.deep.equal([
                'a',
                'b',
                'c'
            ]);

            update(['c', 'b', 'a']);

            expect(itemOf('a'), 'a node reused').to.equal(aBefore);
            expect(itemOf('c'), 'c node reused').to.equal(cBefore);
            expect(
                createdLabels(),
                'no item re-created by the reorder'
            ).to.deep.equal(['a', 'b', 'c']);

            host.remove();
        });
    });

    describe('detection by marker', () => {
        it('should recognize a renamed component context function', () => {
            const fn = renamed(Box({ color: 'red' }));

            expect(isContextFunction(fn)).to.be.true;
            expect(isActivityContextFunction(fn)).to.be.false;
        });

        it('should recognize a renamed activity context function', () => {
            const { effect } = activity(0);
            const fn = renamed(effect(({ value }) => String(value)));

            expect(isContextFunction(fn)).to.be.true;
            expect(isActivityContextFunction(fn)).to.be.true;
        });

        it('should give a renamed context function a persistent child context', () => {
            const parentCtx: ComponentContextPartial = {};
            const first = appendChildContext(
                parentCtx,
                renamed(Box({ color: 'red' })),
                'k'
            );
            const second = appendChildContext(
                parentCtx,
                renamed(Box({ color: 'blue' })),
                'k'
            );

            expect(first, 'context created').to.exist;
            expect(second, 'same context on the next pass').to.equal(first);
        });
    });
});
