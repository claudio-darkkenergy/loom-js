import { FORMATTERS } from './formatters';
import { TASK_RUNNERS } from './task-runners';
import type { RegistryEntry, Registries } from './types';
import { UI_KITS } from './ui-kits';

export type * from './types';

export const REGISTRIES: Registries = {
    formatters: FORMATTERS,
    taskRunners: TASK_RUNNERS,
    uiKits: UI_KITS
};

/** The entry with `id`, or `undefined`. */
export const findEntry = <Entry extends RegistryEntry>(
    entries: readonly Entry[],
    id: string
) => entries.find((entry) => entry.id === id);

/** The entry with `id`; throws for an id validation should have rejected. */
export const entryOf = <Entry extends RegistryEntry>(
    entries: readonly Entry[],
    id: string
) => {
    const entry = findEntry(entries, id);

    if (!entry) {
        throw new Error(`[create] unknown registry entry "${id}".`);
    }

    return entry;
};
