// Pure aggregation helpers — no I/O, unit-tested under `tests/`.
import type { Metric } from '../types.ts';

/** The median of `samples`; the mean of the middle pair for even counts. */
export const median = (samples: number[]): number => {
    if (!samples.length) {
        throw new Error('[bench] median of no samples.');
    }

    const sorted = samples.slice().sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2
        ? (sorted[middle] as number)
        : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
};

/** A `Metric` from raw samples. */
export const toMetric = (samples: number[]): Metric => ({
    median: median(samples),
    samples
});

/**
 * The order to take `sampleCount` samples across `subjects` so that every
 * subject's sample N runs before any subject's sample N+1 — round-robin —
 * and the subject that leads each round rotates, so none consistently
 * runs first.
 */
export const roundRobin = <Subject>(
    subjects: Subject[],
    sampleCount: number
): Array<{ subject: Subject; sample: number }> => {
    const schedule: Array<{ subject: Subject; sample: number }> = [];

    for (let sample = 0; sample < sampleCount; sample += 1) {
        for (let offset = 0; offset < subjects.length; offset += 1) {
            const subject = subjects[
                (sample + offset) % subjects.length
            ] as Subject;

            schedule.push({ sample, subject });
        }
    }

    return schedule;
};
