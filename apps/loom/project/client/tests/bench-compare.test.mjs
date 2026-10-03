import { describe, it } from 'node:test';

import {
    formatBytes,
    formatDate,
    formatMs,
    formatRatio,
    geometricMean,
    orderFrameworks,
    ratio,
    ratioShade,
    slowdown
} from '../../../src/app/pages/benchmarks/lib/compare.ts';
import assert from 'node:assert/strict';

const OPS = ['createRows', 'swapRows'];
const framework = (id, medians) => ({
    id,
    name: id,
    version: null,
    bundle: { bytes: 1, gzipBytes: 1 },
    startupMs: { median: 1, samples: [1] },
    heapBytes: { median: 1, samples: [1] },
    ops: Object.fromEntries(
        OPS.map((opId, index) => [
            opId,
            { median: medians[index], samples: [medians[index]] }
        ])
    )
});

describe('ratio and geometricMean', () => {
    it('divides by the baseline', () => {
        assert.equal(ratio(60, 40), 1.5);
    });

    it('is NaN against a zero baseline', () => {
        assert.ok(Number.isNaN(ratio(1, 0)));
    });

    it('takes the geometric mean', () => {
        assert.equal(geometricMean([2, 8]), 4);
    });
});

describe('orderFrameworks', () => {
    const vanilla = framework('vanilla', [10, 1]);
    const fast = framework('solid', [11, 1.1]);
    const slow = framework('loom', [40, 40]);

    it('puts the baseline first and the rest by ascending slowdown', () => {
        assert.deepEqual(
            orderFrameworks([slow, vanilla, fast], OPS).map(({ id }) => id),
            ['vanilla', 'solid', 'loom']
        );
    });

    it('keeps the input order without a baseline', () => {
        assert.deepEqual(
            orderFrameworks([slow, fast], OPS).map(({ id }) => id),
            ['loom', 'solid']
        );
    });

    it('summarizes a framework as the geometric mean of its ratios', () => {
        assert.ok(
            Math.abs(slowdown(slow, vanilla, OPS) - Math.sqrt(4 * 40)) < 1e-9
        );
    });
});

describe('ratioShade', () => {
    it('is zero at parity and below', () => {
        assert.equal(ratioShade(1), 0);
        assert.equal(ratioShade(0.5), 0);
    });

    it('is log-scaled up to the cap', () => {
        assert.equal(ratioShade(32), 1);
        assert.equal(ratioShade(1000), 1);
        assert.ok(Math.abs(ratioShade(2) - 0.2) < 1e-9);
    });

    it('is zero for a missing ratio', () => {
        assert.equal(ratioShade(NaN), 0);
    });
});

describe('formatting', () => {
    it('formats durations by magnitude', () => {
        assert.equal(formatMs(0.456), '0.46 ms');
        assert.equal(formatMs(48.6), '48.6 ms');
    });

    it('formats ratios with a dash for missing values', () => {
        assert.equal(formatRatio(1.5), '1.50×');
        assert.equal(formatRatio(22.9), '22.9×');
        assert.equal(formatRatio(NaN), '—');
    });

    it('formats the run day without a time-zone shift', () => {
        assert.equal(formatDate('2026-10-02'), 'October 2, 2026');
        assert.equal(formatDate('2026-01-31'), 'January 31, 2026');
    });

    it('formats bytes in the nearest unit', () => {
        assert.equal(formatBytes(900), '900 B');
        assert.equal(formatBytes(13392), '13.1 kB');
        assert.equal(formatBytes(9 * 1024 * 1024), '9.0 MB');
    });
});
