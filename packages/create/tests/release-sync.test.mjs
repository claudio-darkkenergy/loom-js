// The release-sync guard's rules, over fixture changesets.
import { describe, it } from 'node:test';

import {
    findDrift,
    parseChangeset,
    pendingBumps,
    satisfiesCaret
} from '../scripts/check-release-sync.mjs';
import assert from 'node:assert/strict';

const versions = {
    '@loom-js/build': '0.3.0',
    '@loom-js/core': '0.21.0',
    '@loom-js/devtools': '0.1.0',
    '@loom-js/pink': '0.10.1'
};

const changeset = (frontmatter) => `---\n${frontmatter}\n---\n\nNotes.\n`;

describe('release sync', () => {
    it('reads every quoting style in the frontmatter', () => {
        assert.deepEqual(
            parseChangeset(
                changeset('\'@loom-js/core\': minor\n"@loom-js/pink": patch')
            ),
            { '@loom-js/core': 'minor', '@loom-js/pink': 'patch' }
        );
    });

    it('fails a core minor without a create release', () => {
        const bumps = pendingBumps([
            parseChangeset(changeset("'@loom-js/core': minor"))
        ]);

        assert.deepEqual(findDrift(bumps, versions), [
            { from: '0.21.0', name: '@loom-js/core', to: '0.22.0' }
        ]);
    });

    it('passes a core patch', () => {
        const bumps = pendingBumps([
            parseChangeset(changeset("'@loom-js/core': patch"))
        ]);

        assert.deepEqual(findDrift(bumps, versions), []);
    });

    it('passes a core minor released with create', () => {
        const bumps = pendingBumps([
            parseChangeset(changeset("'@loom-js/core': minor")),
            parseChangeset(changeset("'@loom-js/create': patch"))
        ]);

        assert.deepEqual(findDrift(bumps, versions), []);
    });

    it('takes the highest bump across changesets', () => {
        assert.deepEqual(
            pendingBumps([
                { '@loom-js/pink': 'patch' },
                { '@loom-js/pink': 'minor' },
                { '@loom-js/pink': 'patch' }
            ]),
            { '@loom-js/pink': 'minor' }
        );
    });

    it('applies npm caret rules', () => {
        assert.ok(satisfiesCaret('0.21.0', '0.21.4'));
        assert.ok(!satisfiesCaret('0.21.0', '0.22.0'));
        assert.ok(!satisfiesCaret('0.0.3', '0.0.4'));
        assert.ok(satisfiesCaret('1.2.0', '1.9.0'));
        assert.ok(!satisfiesCaret('1.2.0', '2.0.0'));
    });
});
