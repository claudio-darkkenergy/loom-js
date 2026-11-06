import { toJson } from '../json';
import type { TaskRunner } from './types';

// Task settings per script; anything unlisted gets turbo's defaults.
const TURBO_TASKS: Record<string, object> = {
    build: { dependsOn: ['^build'], outputs: ['build/**'] },
    dev: { cache: false, persistent: true }
};

export const turbo: TaskRunner = {
    devDependencies: ['turbo'],
    gitignore: ['.turbo'],
    id: 'turbo',
    label: 'Turborepo',
    rootFiles: ({ scripts }) => ({
        'turbo.json': toJson({
            $schema: 'https://turborepo.com/schema.json',
            tasks: Object.fromEntries(
                scripts.map((script) => [script, TURBO_TASKS[script] ?? {}])
            )
        })
    }),
    runScript: (script) => `turbo run ${script}`
};

export const TASK_RUNNERS: readonly TaskRunner[] = [turbo];
