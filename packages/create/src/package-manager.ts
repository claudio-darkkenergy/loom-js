// The package manager that invoked the CLI, read from the user agent npm,
// pnpm, yarn and bun all set for the scripts they run.
import type { Spawn } from './io';

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface PackageManager {
    name: PackageManagerName;
    /** The version, when the user agent named one. */
    version?: string;
}

const NAMES: readonly PackageManagerName[] = ['npm', 'pnpm', 'yarn', 'bun'];

/** Reads `npm_config_user_agent` (`pnpm/9.12.0 npm/? node/v24…`); npm otherwise. */
export const detectPackageManager = (
    env: Readonly<Record<string, string | undefined>>
): PackageManager => {
    const [name, version] =
        env.npm_config_user_agent?.split(' ')[0]?.split('/') ?? [];
    const known = NAMES.find((candidate) => candidate === name);

    return known ? { name: known, version } : { name: 'npm' };
};

/** The version for `packageManager`, asking the binary when the agent didn't say. */
export const resolveVersion = async (
    packageManager: PackageManager,
    spawn: Spawn,
    cwd: string
) => {
    if (packageManager.version) {
        return packageManager.version;
    }

    const { code, stdout } = await spawn(packageManager.name, ['--version'], {
        cwd
    });

    return code === 0 ? stdout.trim() : undefined;
};

/** The command line that installs dependencies. */
export const installCommand = ({ name }: PackageManager) => [name, 'install'];

/** How to run a `package.json` script. */
export const runCommand = ({ name }: PackageManager, script: string) =>
    name === 'npm' || name === 'bun'
        ? `${name} run ${script}`
        : `${name} ${script}`;
