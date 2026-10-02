// The results contract between the runner and the docs site. The site
// imports only this module, so a clone can type-check without a results file.

export const FRAMEWORK_IDS = [
    'vanilla',
    'loom',
    'react',
    'vue',
    'svelte',
    'solid'
] as const;

export type FrameworkId = (typeof FRAMEWORK_IDS)[number];

export const OP_IDS = [
    'createRows',
    'replaceAll',
    'partialUpdate',
    'selectRow',
    'swapRows',
    'removeRow',
    'clearRows',
    'appendRows'
] as const;

export type OpId = (typeof OP_IDS)[number];

/** One measured quantity: the median the page shows and the raw samples behind it. */
export interface Metric {
    median: number;
    samples: number[];
}

export interface BenchEnvironment {
    platform: string;
    arch: string;
    cpuModel: string;
    cpus: number;
    memoryGb: number;
    chrome: string;
    node: string;
    runner: 'local' | 'vercel' | 'github';
}

export interface FrameworkResult {
    id: FrameworkId;
    name: string;
    /** The installed package version; `null` for vanilla. */
    version: string | null;
    bundle: { bytes: number; gzipBytes: number };
    startupMs: Metric;
    heapBytes: Metric;
    ops: Record<OpId, Metric>;
}

export interface BenchResults {
    schemaVersion: 1;
    /** ISO timestamp of the run. */
    generatedAt: string;
    environment: BenchEnvironment;
    frameworks: FrameworkResult[];
}

/** The results schema version this runner writes and the site reads. */
export const BENCH_SCHEMA_VERSION = 1 as const;
