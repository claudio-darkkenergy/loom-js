import type { BenchResults } from '@loom-js/bench';

/** Where the loom build copies the bench workspace's `results/latest.json`. */
export const BENCH_RESULTS_URL = '/static/bench/latest.json';

let seeded: BenchResults | undefined;

/**
 * Hands the provider the results directly — the prerender pass calls this
 * so the route settles from the file on disk instead of fetching a URL the
 * build-time window cannot reach.
 */
export const seedBenchResults = (results: BenchResults) => {
    seeded = results;
};

/** The results: the seeded document when one was given, otherwise fetched. */
export const getBenchResults = async (): Promise<BenchResults> => {
    if (seeded) {
        return seeded;
    }

    const response = await fetch(BENCH_RESULTS_URL);

    if (!response.ok) {
        throw new Error(
            `The benchmark results request failed (${response.status}).`
        );
    }

    return (await response.json()) as BenchResults;
};
