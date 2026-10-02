import { describe, it } from 'node:test';

import { median, roundRobin, toMetric } from '../src/runner/stats.ts';
import assert from 'node:assert/strict';

describe('median', () => {
    it('takes the middle value of an odd count', () => {
        assert.equal(median([5, 1, 3]), 3);
    });

    it('averages the middle pair of an even count', () => {
        assert.equal(median([4, 1, 3, 2]), 2.5);
    });

    it('does not reorder the input', () => {
        const samples = [3, 1, 2];

        median(samples);
        assert.deepEqual(samples, [3, 1, 2]);
    });

    it('refuses an empty sample set', () => {
        assert.throws(() => median([]), /no samples/);
    });
});

describe('toMetric', () => {
    it('keeps the raw samples next to the median', () => {
        assert.deepEqual(toMetric([2, 1, 3]), {
            median: 2,
            samples: [2, 1, 3]
        });
    });
});

describe('roundRobin', () => {
    it("finishes every subject's sample N before any sample N+1", () => {
        const schedule = roundRobin(['a', 'b', 'c'], 2);

        assert.deepEqual(
            schedule.map(({ sample }) => sample),
            [0, 0, 0, 1, 1, 1]
        );
    });

    it('rotates which subject leads each round', () => {
        const schedule = roundRobin(['a', 'b', 'c'], 3);
        const leaders = [0, 3, 6].map((index) => schedule[index].subject);

        assert.deepEqual(leaders, ['a', 'b', 'c']);
    });

    it('schedules every subject exactly sampleCount times', () => {
        const schedule = roundRobin(['a', 'b'], 15);
        const counts = schedule.reduce((tally, { subject }) => {
            tally[subject] = (tally[subject] ?? 0) + 1;

            return tally;
        }, {});

        assert.deepEqual(counts, { a: 15, b: 15 });
    });
});
