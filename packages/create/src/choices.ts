// The choices a scaffold is made from. Registry-backed choices hold an entry
// id (or `none`); the rest are fixed sets.
export type Layout = 'single' | 'monorepo';

export type GitChoice =
    { kind: 'new' } | { kind: 'none' } | { kind: 'clone'; url: string };

export interface Choices {
    /** The target directory, as given. */
    target: string;
    layout: Layout;
    /** A task-runner id; set only for a monorepo. */
    taskRunner?: string;
    /** Client-only rendering instead of server-first. */
    spa: boolean;
    /** A UI kit id, or `none`. */
    ui: string;
    tailwind: boolean;
    /** A formatter id, or `none`. */
    formatter: string;
    js: boolean;
    git: GitChoice;
    install: boolean;
}

export const NONE = 'none';

export const DEFAULT_TARGET = 'loom-app';

/** Every default except the task runner, which the registry's first entry supplies. */
export const DEFAULTS: Omit<Choices, 'target' | 'taskRunner'> = {
    formatter: 'biome',
    git: { kind: 'new' },
    install: true,
    js: false,
    layout: 'single',
    spa: false,
    tailwind: false,
    ui: NONE
};
