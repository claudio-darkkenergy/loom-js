import { describe, it } from 'node:test';

import loom from '../dist/index.js';
import assert from 'node:assert/strict';

describe('plugin shape', () => {
    it('exports meta, rules, and a recommended flat config', () => {
        assert.equal(loom.meta.name, '@loom-js/eslint-plugin');
        assert.equal(typeof loom.rules, 'object');
        assert.equal(loom.configs.recommended.plugins.loom, loom);
    });

    it('enables every rule at error in recommended', () => {
        assert.deepEqual(
            Object.keys(loom.configs.recommended.rules).sort(),
            Object.keys(loom.rules)
                .map((ruleName) => `loom/${ruleName}`)
                .sort()
        );

        for (const severity of Object.values(loom.configs.recommended.rules)) {
            assert.equal(severity, 'error');
        }
    });
});
