// Pure helpers behind the benchmarks page — ratios, ordering, formatting.
// No runtime imports, so the node test suite loads this file directly.
import type { BenchResults, FrameworkResult, OpId } from '@loom-js/bench';

export const BASELINE_ID = 'vanilla';

/** How many times `value` is of `baseline`; `NaN` when the baseline is zero. */
export const ratio = (value: number, baseline: number): number =>
    baseline === 0 ? NaN : value / baseline;

/** The geometric mean of positive values; `NaN` for an empty list. */
export const geometricMean = (values: number[]): number =>
    values.length
        ? Math.exp(
              values.reduce((sum, value) => sum + Math.log(value), 0) /
                  values.length
          )
        : NaN;

const baselineOf = (frameworks: FrameworkResult[]) =>
    frameworks.find(({ id }) => id === BASELINE_ID);

/** Every op's ratio to the baseline for one framework, in op order. */
export const opRatios = (
    framework: FrameworkResult,
    baseline: FrameworkResult,
    opIds: readonly OpId[]
): number[] =>
    opIds.map((opId) =>
        ratio(framework.ops[opId].median, baseline.ops[opId].median)
    );

/** The geometric mean of a framework's op ratios — its one-number summary. */
export const slowdown = (
    framework: FrameworkResult,
    baseline: FrameworkResult,
    opIds: readonly OpId[]
): number => geometricMean(opRatios(framework, baseline, opIds));

/**
 * The column order: the baseline first, then the rest by ascending slowdown.
 * Without a baseline the input order is kept.
 */
export const orderFrameworks = (
    frameworks: FrameworkResult[],
    opIds: readonly OpId[]
): FrameworkResult[] => {
    const baseline = baselineOf(frameworks);

    if (!baseline) {
        return frameworks.slice();
    }

    const rest = frameworks
        .filter((framework) => framework !== baseline)
        .map((framework) => ({
            framework,
            slowdown: slowdown(framework, baseline, opIds)
        }))
        .sort((left, right) => left.slowdown - right.slowdown)
        .map(({ framework }) => framework);

    return [baseline, ...rest];
};

/** The baseline framework, or `undefined` when the results carry none. */
export const findBaseline = (results: BenchResults) =>
    baselineOf(results.frameworks);

/**
 * A 0..1 shade for a ratio: 0 at parity and below, 1 at `max` and above,
 * log-scaled in between so 2× and 4× sit a step apart like 4× and 8× do.
 */
export const ratioShade = (value: number, max = 32): number => {
    if (!Number.isFinite(value) || value <= 1) {
        return 0;
    }

    return Math.min(1, Math.log(value) / Math.log(max));
};

export const formatMs = (value: number): string =>
    value < 10 ? `${value.toFixed(2)} ms` : `${value.toFixed(1)} ms`;

export const formatRatio = (value: number): string =>
    Number.isFinite(value) ? `${value.toFixed(value < 10 ? 2 : 1)}×` : '—';

export const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} kB` : `${bytes} B`;
};

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

/**
 * A `YYYY-MM-DD` day as "October 2, 2026". No `Date` round-trip: the day was
 * chosen by the runner and must not shift with any time zone.
 */
export const formatDate = (day: string): string => {
    const [year, month, date] = day.split('-').map(Number);

    return `${MONTHS[(month ?? 1) - 1]} ${date}, ${year}`;
};
