import { benchResults } from '../activity/bench-results';

/** Loads the benchmark results once per window; later calls hit the cache. */
export const useBenchResults = () => {
    benchResults.update(null);
};
