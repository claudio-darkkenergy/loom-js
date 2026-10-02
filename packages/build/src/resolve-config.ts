import type {
    ConfigEnv,
    LoomConfig,
    LoomConfigExport,
    Mode,
    PrerenderOptions,
    ResolveOptions,
    ResolvedConfig
} from './config';
import path from 'node:path';

export const DEFAULT_OUT_DIR = 'build';
export const DEFAULT_PORT = 3000;

/**
 * Production unless asked otherwise: an explicit `--mode` wins, then
 * `NODE_ENV=development` — CI build environments often set neither.
 */
export const resolveMode = (
    explicit?: string,
    env: NodeJS.ProcessEnv = process.env
): Mode => {
    if (explicit === 'development' || explicit === 'production') {
        return explicit;
    }

    if (explicit) {
        throw new Error(
            `[loom] unknown mode "${explicit}" — use "development" or "production".`
        );
    }

    return env.NODE_ENV === 'development' ? 'development' : 'production';
};

/** Unwraps the function form, then fills every default. */
export const resolveConfig = async (
    configExport: LoomConfigExport,
    { cwd = process.cwd(), mode, outDir }: ResolveOptions
): Promise<ResolvedConfig> => {
    const env: ConfigEnv = { mode };
    const config: LoomConfig =
        typeof configExport === 'function'
            ? await configExport(env)
            : configExport;

    if (!config.entry) {
        throw new Error('[loom] config needs an `entry` module.');
    }

    const root = path.resolve(cwd, config.root ?? '.');

    return {
        copy: config.copy ?? [],
        define: config.define ?? {},
        entry: config.entry,
        esbuild: config.esbuild,
        html: config.html ?? {},
        mode,
        outDir: path.resolve(root, outDir ?? config.outDir ?? DEFAULT_OUT_DIR),
        prerender: config.prerender as PrerenderOptions | undefined,
        publicDir: config.publicDir,
        root,
        routes: config.routes?.length ? config.routes : ['/'],
        server: { port: DEFAULT_PORT, ...config.server },
        styles: config.styles ?? []
    };
};
