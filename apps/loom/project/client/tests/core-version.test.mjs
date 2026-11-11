import { describe, it } from 'node:test';

import { readCoreVersion } from '../core-version.mts';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const appDir = path.resolve(import.meta.dirname, '../../..');

const fixtureApp = (manifest) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'core-version-'));
    const coreDir = path.join(dir, 'node_modules/@loom-js/core');

    mkdirSync(coreDir, { recursive: true });
    writeFileSync(path.join(coreDir, 'package.json'), manifest);

    return dir;
};

describe('readCoreVersion', () => {
    it("matches the workspace core's version", () => {
        const { version } = JSON.parse(
            readFileSync(
                path.resolve(appDir, '../../packages/core/package.json'),
                'utf8'
            )
        );

        assert.equal(readCoreVersion(appDir), version);
    });

    it('throws naming the manifest when it is missing', () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'core-version-'));

        assert.throws(
            () => readCoreVersion(dir),
            /node_modules\/@loom-js\/core\/package\.json could not be read/
        );
    });

    it('throws on a non-semver version', () => {
        const dir = fixtureApp(JSON.stringify({ version: 'latest' }));

        assert.throws(
            () => readCoreVersion(dir),
            /has no semver "version" \(got "latest"\)/
        );
    });

    it('accepts a prerelease version', () => {
        const dir = fixtureApp(JSON.stringify({ version: '1.0.0-beta.2' }));

        assert.equal(readCoreVersion(dir), '1.0.0-beta.2');
    });
});
