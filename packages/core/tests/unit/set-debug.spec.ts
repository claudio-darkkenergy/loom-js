import { expect } from '@esm-bundle/chai';

import { canDebug, setDebug } from '../../src/config';

// Specs for the debug-narration switch (`setDebug`): scope merging without
// shared-state mutation, the scopes-first overload, and an honest return
// value — regression cover for the `Object.assign`-onto-primitive bug that
// produced a truthy Boolean-wrapper debug state.
describe('setDebug', () => {
    afterEach(() => {
        setDebug(false);
    });

    it('enables the full scope set by default and reports it', () => {
        const result = setDebug(true);

        expect(typeof result, 'a plain scope record, never a wrapper').to.equal(
            'object'
        );
        expect(canDebug('updates'), 'updates on').to.be.ok;
        expect(canDebug('activity'), 'activity on').to.be.ok;
    });

    it('makes the active set exactly the provided scopes', () => {
        setDebug(true);
        const result = setDebug(true, { updates: false });

        expect(canDebug('updates'), 'updates muted').to.not.be.ok;
        expect(
            canDebug('creation'),
            'unlisted scopes are off — the call defines the set'
        ).to.not.be.ok;
        expect(
            result && result.updates,
            'return reflects the muted scope'
        ).to.equal(false);
    });

    it('treats a scopes-first call as an enable', () => {
        setDebug({ updates: true, activity: false });

        expect(canDebug('updates'), 'requested scope on').to.be.ok;
        expect(canDebug('activity'), 'muted scope off').to.not.be.ok;
    });

    it('turns everything off with false and reports the whole record', () => {
        setDebug(true);
        const result = setDebug(false);

        expect(result, 'off state is still the full record').to.deep.equal({
            activity: false,
            creation: false,
            mutations: false,
            updates: false
        });
        expect(canDebug('updates'), 'no scope survives off').to.not.be.ok;
    });

    it('always reports every scope explicitly', () => {
        const result = setDebug({ updates: true });

        expect(result, 'unlisted scopes appear as false').to.deep.equal({
            activity: false,
            creation: false,
            mutations: false,
            updates: true
        });
    });

    it('never mutates the default scope set across enables', () => {
        setDebug(true, { updates: false });
        setDebug(false);
        setDebug(true);

        expect(canDebug('updates'), 'a fresh enable restores the full defaults')
            .to.be.ok;
    });
});
