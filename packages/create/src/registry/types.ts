// The registry descriptors. Prompts, `--help`, validation and the scaffold
// all enumerate the registries, so a new kit, task runner or formatter is one
// entry (plus, for a kit, its template layer under `templates/ui/<id>`).

export interface UiKit {
    id: string;
    label: string;
    /** Runtime dependencies the kit adds. */
    packages: readonly string[];
    /** Stylesheets the browser entry imports. */
    stylesheets: readonly string[];
    /** A class the shells' `<body>` needs before boot. */
    bodyClass?: string;
    tailwind: {
        /** The stylesheet imported ahead of `tailwindcss` instead of by the entry. */
        stylesheet: string;
        /** Kit class names Tailwind must not generate as utilities. */
        sourceExclusions: readonly string[];
    };
}

export interface TaskRunnerContext {
    /** The scripts the root runs across the workspaces. */
    scripts: readonly string[];
}

export interface TaskRunner {
    id: string;
    label: string;
    devDependencies: readonly string[];
    /** The root script that runs `script` in every workspace. */
    runScript: (script: string) => string;
    /** Files at the workspace root, keyed by path. */
    rootFiles: (context: TaskRunnerContext) => Record<string, string>;
    /** Paths the root `.gitignore` adds. */
    gitignore: readonly string[];
}

export interface FormatterContext {
    /** Generated paths beyond the shared list, e.g. the task runner's cache. */
    ignored: readonly string[];
}

export interface Formatter {
    id: string;
    label: string;
    devDependencies: readonly string[];
    /** Config and ignore files at the formatting root, keyed by path. */
    files: (context: FormatterContext) => Record<string, string>;
    /** The `format` script: rewrites files in place. */
    fixCommand: readonly string[];
    /** The `format:check` script: fails on unformatted files. */
    checkCommand: readonly string[];
}

export interface Registries {
    uiKits: readonly UiKit[];
    taskRunners: readonly TaskRunner[];
    formatters: readonly Formatter[];
}

export interface RegistryEntry {
    id: string;
    label: string;
}
