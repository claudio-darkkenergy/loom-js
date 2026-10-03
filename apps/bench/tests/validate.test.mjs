import { describe, it } from 'node:test';

import { assertBenchResults } from '../src/runner/validate.ts';
import { OP_IDS } from '../src/types.ts';
import assert from 'node:assert/strict';

const metric = { median: 1, samples: [1, 1, 1] };
const framework = (overrides = {}) => ({
    id: 'loom',
    name: 'Loom',
    version: '0.17.1',
    bundle: { bytes: 100, gzipBytes: 50 },
    startupMs: metric,
    heapBytes: metric,
    ops: Object.fromEntries(OP_IDS.map((opId) => [opId, metric])),
    ...overrides
});
const results = (overrides = {}) => ({
    schemaVersion: 1,
    generatedAt: '2026-10-03T00:25:58.000Z',
    generatedDate: '2026-10-02',
    environment: {
        platform: 'darwin',
        arch: 'arm64',
        cpuModel: 'Apple M3',
        cpus: 8,
        memoryGb: 16,
        chrome: 'Chrome/153.0.0.0',
        node: 'v24.0.0',
        runner: 'local'
    },
    frameworks: [
        framework(),
        framework({ id: 'vanilla', name: 'Vanilla JS', version: null })
    ],
    ...overrides
});

describe('assertBenchResults', () => {
    it('returns a complete document unchanged', () => {
        const document = results();

        assert.equal(assertBenchResults(document), document);
    });

    it('rejects a missing run day', () => {
        assert.throws(
            () => assertBenchResults(results({ generatedDate: '10/02/2026' })),
            /generatedDate/
        );
    });

    it('rejects another schema version', () => {
        assert.throws(
            () => assertBenchResults(results({ schemaVersion: 2 })),
            /schemaVersion 2/
        );
    });

    it('rejects a missing op metric', () => {
        const { createRows: _dropped, ...ops } = framework().ops;

        assert.throws(
            () =>
                assertBenchResults(
                    results({ frameworks: [framework({ ops })] })
                ),
            /ops\.createRows/
        );
    });

    it('rejects a non-finite sample', () => {
        const broken = framework({
            startupMs: { median: 1, samples: [1, NaN] }
        });

        assert.throws(
            () => assertBenchResults(results({ frameworks: [broken] })),
            /startupMs\.samples/
        );
    });

    it('rejects an unknown framework id', () => {
        assert.throws(
            () =>
                assertBenchResults(
                    results({ frameworks: [framework({ id: 'angular' })] })
                ),
            /id is unknown/
        );
    });

    it('rejects an unknown runner', () => {
        const environment = { ...results().environment, runner: 'laptop' };

        assert.throws(
            () => assertBenchResults(results({ environment })),
            /runner laptop/
        );
    });

    it('accepts a null version only as null', () => {
        assert.throws(
            () =>
                assertBenchResults(
                    results({ frameworks: [framework({ version: 3 })] })
                ),
            /version must be a string or null/
        );
    });
});
