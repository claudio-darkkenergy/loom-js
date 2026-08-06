import { expect } from '@esm-bundle/chai';

import { component } from '../../src';
import { activity } from '../../src/activity';
import { runSetup } from '../support/run-setup';

// Characterization probe for `openspec/changes/add-template-component-syntax`
// task 1.1: `ctxScopes` holds ONE context slot per template function
// (component.ts:36-38), so N live instances of one template function reached
// through a single `ctxScopes`-carrying context would collide into one
// context. These specs pin down whether any reachable path does that.
// The recorded answer lives in design.md (Decision 3 / Open Questions).

// One module-level component = one stable template-function identity, the
// same shape a synthesized children component will have after the transform.
const Label = component<{ label?: string }>(
    (html, { label }) => html`
        <span data-label=${label}></span>
    `
);

const Pair = component<{ first?: string; second?: string }>(
    (html, { first, second }) => html`
        <div>${Label({ label: first })}${Label({ label: second })}</div>
    `
);

const labelNodes = ($root: HTMLElement) =>
    Array.from($root.querySelectorAll<HTMLElement>('[data-label]'));
const labelValues = ($root: HTMLElement) =>
    labelNodes($root).map((el) => el.getAttribute('data-label'));

describe('context reuse across an activity effect scope (ctxScopes)', () => {
    it('should reuse one scoped context for the same template function across effect re-runs', async () => {
        const flag = activity(true);
        const TestComponent = component(
            (html) => html`
                <main>
                    ${flag.effect(({ value }) =>
                        Label({ label: value ? 'on' : 'off' })
                    )}
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const nodeBefore = $test.querySelector('[data-label]');
        expect(nodeBefore?.getAttribute('data-label')).to.equal('on');

        flag.update(false);

        const nodeAfter = $test.querySelector('[data-label]');
        // Same node — the single `ctxScopes` slot for `Label` was reused.
        expect(nodeAfter, 'same context, same node').to.equal(nodeBefore);
        expect(nodeAfter?.getAttribute('data-label')).to.equal('off');
    });

    it('should give two instances of one template function their own contexts via template slots', async () => {
        const labels = activity(
            { first: 'one', second: 'two' },
            { deep: true }
        );
        const TestComponent = component(
            (html) => html`
                <main>${labels.effect(({ value }) => Pair(value))}</main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const before = labelNodes($test);
        // A collision into one `ctxScopes` slot would leave a single node —
        // the 2nd render would relocate the 1st instance's root.
        expect(before, 'both instances rendered').to.have.length(2);
        expect(labelValues($test)).to.deep.equal(['one', 'two']);

        labels.update({ first: 'uno', second: 'dos' });

        const after = labelNodes($test);
        expect(after, 'still two distinct nodes').to.have.length(2);
        expect(after[0], 'first node reused').to.equal(before[0]);
        expect(after[1], 'second node reused').to.equal(before[1]);
        expect(labelValues($test)).to.deep.equal(['uno', 'dos']);
    });

    it('should give unkeyed array instances of one template function their own contexts', async () => {
        const labels = activity(['one', 'two', 'three'], { deep: true });
        const TestComponent = component(
            (html) => html`
                <main>
                    ${labels.effect(({ value }) =>
                        value.map((label) => Label({ label }))
                    )}
                </main>
            `
        );

        // The effect ctx carries `ctxScopes`, but the array path must route
        // around it through `parentCtx.children` (index-keyed).
        const $test = await runSetup({ containerProps: { TestComponent } });
        const before = labelNodes($test);
        expect(before, 'all instances rendered').to.have.length(3);
        expect(labelValues($test)).to.deep.equal(['one', 'two', 'three']);

        labels.update(['uno', 'dos', 'tres']);

        const after = labelNodes($test);
        expect(after, 'still three distinct nodes').to.have.length(3);
        // Unkeyed — index keyspace: each node updates in place.
        expect(after[0], 'index 0 reused').to.equal(before[0]);
        expect(after[2], 'index 2 reused').to.equal(before[2]);
        expect(labelValues($test)).to.deep.equal(['uno', 'dos', 'tres']);
    });
});
