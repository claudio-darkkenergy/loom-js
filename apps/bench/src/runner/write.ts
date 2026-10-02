// Writes the validated results file — atomically, so a failed run never
// leaves a half-written document for the loom build to read.
import type { BenchResults } from '../types.ts';
import { assertBenchResults } from './validate.ts';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const RESULTS_FILE = 'results/latest.json';

export const writeResults = async (
    root: string,
    results: unknown
): Promise<BenchResults> => {
    const valid = assertBenchResults(results);
    const target = path.join(root, RESULTS_FILE);
    const temporary = `${target}.tmp`;

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(temporary, `${JSON.stringify(valid, null, 4)}\n`);
    await rename(temporary, target);

    return valid;
};
