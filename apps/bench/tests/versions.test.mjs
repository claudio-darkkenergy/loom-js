import { describe, it } from 'node:test';

import { installedVersion } from '../src/runner/versions.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

describe('installedVersion', () => {
    it('reads the version of a package whose exports hide package.json', () => {
        const expected = JSON.parse(
            readFileSync(
                path.join(root, '../../packages/core/package.json'),
                'utf8'
            )
        ).version;

        assert.equal(installedVersion('@loom-js/core', root), expected);
    });

    it('reads a plain package version', () => {
        assert.equal(
            installedVersion('react', root),
            require('react/package.json').version
        );
    });

    it('throws for a package that is not installed', () => {
        assert.throws(
            () => installedVersion('not-a-real-package-xyz', root),
            /Cannot find/
        );
    });
});
