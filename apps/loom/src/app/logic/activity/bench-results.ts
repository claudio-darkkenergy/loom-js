import type { BenchResults } from '@loom-js/bench';
import { activity, resource } from '@loom-js/core';

import { getBenchResults } from '@/app/logic/providers/bench-results';

export interface BenchResultsFailure {
    benchError: string;
}

/** The resource-cache key the prerender pass validates in the dehydrated state. */
export const BENCH_RESULTS_RESOURCE_KEY = 'bench:results';

/**
 * The benchmark results pipeline: `update(null)` loads the results through
 * the keyed resource cache, so a prerendered `/benchmarks` carries them in
 * its dehydrated state and the client hydrates without a request. A failed
 * load commits a failure value and stays out of the cache, so the next
 * navigation retries.
 */
export const benchResults = activity<
    BenchResults | BenchResultsFailure | undefined,
    null
>(undefined, async ({ signal, update }) => {
    try {
        const results = await resource(
            BENCH_RESULTS_RESOURCE_KEY,
            getBenchResults
        );

        if (!signal.aborted) {
            update(results);
        }
    } catch (loadError) {
        if (!signal.aborted) {
            update({
                benchError:
                    loadError instanceof Error
                        ? loadError.message
                        : 'The benchmark results request failed.'
            });
        }
    }
});

export const isBenchFailure = (
    value: BenchResults | BenchResultsFailure | undefined
): value is BenchResultsFailure => !!value && 'benchError' in value;
