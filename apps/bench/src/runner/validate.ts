// The schema gate between the runner and the results file — pure, tested.
import {
    BENCH_SCHEMA_VERSION,
    type BenchResults,
    FRAMEWORK_IDS,
    type Metric,
    OP_IDS
} from '../types.ts';

const fail = (message: string): never => {
    throw new Error(`[bench] invalid results: ${message}`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const assertMetric = (value: unknown, where: string): Metric => {
    if (!isRecord(value)) {
        return fail(`${where} is not a metric`);
    }

    if (!isFiniteNumber(value.median)) {
        return fail(`${where}.median is not a finite number`);
    }

    if (
        !Array.isArray(value.samples) ||
        !value.samples.length ||
        !value.samples.every(isFiniteNumber)
    ) {
        return fail(
            `${where}.samples must be a non-empty array of finite numbers`
        );
    }

    return value as unknown as Metric;
};

/**
 * Throws unless `value` is a complete `BenchResults` document: schema
 * version, timestamp, environment, and for every framework a version,
 * bundle sizes and a finite metric for startup, heap and every op.
 */
export const assertBenchResults = (value: unknown): BenchResults => {
    if (!isRecord(value)) {
        return fail('not an object');
    }

    if (value.schemaVersion !== BENCH_SCHEMA_VERSION) {
        return fail(
            `schemaVersion ${String(value.schemaVersion)} is not ${BENCH_SCHEMA_VERSION}`
        );
    }

    if (
        typeof value.generatedAt !== 'string' ||
        Number.isNaN(Date.parse(value.generatedAt))
    ) {
        return fail('generatedAt is not an ISO timestamp');
    }

    if (
        typeof value.generatedDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value.generatedDate)
    ) {
        return fail('generatedDate is not a YYYY-MM-DD day');
    }

    const environment = value.environment;

    if (!isRecord(environment)) {
        return fail('environment missing');
    }

    for (const field of [
        'platform',
        'arch',
        'cpuModel',
        'chrome',
        'node',
        'runner'
    ]) {
        if (typeof environment[field] !== 'string' || !environment[field]) {
            return fail(`environment.${field} is not a non-empty string`);
        }
    }

    if (!['local', 'vercel', 'github'].includes(environment.runner as string)) {
        return fail(
            `environment.runner ${String(environment.runner)} is unknown`
        );
    }

    if (
        !isFiniteNumber(environment.cpus) ||
        !isFiniteNumber(environment.memoryGb)
    ) {
        return fail('environment.cpus / memoryGb are not finite numbers');
    }

    if (!Array.isArray(value.frameworks) || !value.frameworks.length) {
        return fail('frameworks is empty');
    }

    for (const framework of value.frameworks as unknown[]) {
        if (!isRecord(framework)) {
            return fail('a framework entry is not an object');
        }

        const where = `frameworks[${String(framework.id)}]`;

        if (
            !FRAMEWORK_IDS.includes(
                framework.id as (typeof FRAMEWORK_IDS)[number]
            )
        ) {
            return fail(`${where}.id is unknown`);
        }

        if (typeof framework.name !== 'string' || !framework.name) {
            return fail(`${where}.name is not a non-empty string`);
        }

        if (
            framework.version !== null &&
            typeof framework.version !== 'string'
        ) {
            return fail(`${where}.version must be a string or null`);
        }

        if (
            !isRecord(framework.bundle) ||
            !isFiniteNumber(framework.bundle.bytes) ||
            !isFiniteNumber(framework.bundle.gzipBytes)
        ) {
            return fail(`${where}.bundle sizes are not finite numbers`);
        }

        assertMetric(framework.startupMs, `${where}.startupMs`);
        assertMetric(framework.heapBytes, `${where}.heapBytes`);

        if (!isRecord(framework.ops)) {
            return fail(`${where}.ops missing`);
        }

        for (const opId of OP_IDS) {
            assertMetric(framework.ops[opId], `${where}.ops.${opId}`);
        }
    }

    return value as unknown as BenchResults;
};
