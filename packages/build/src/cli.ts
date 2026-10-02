// The `loom` command: `build`, `dev` and `prerender` over `loom.config.*`.
import { build } from './build';
import { dev } from './dev';
import { loadConfig } from './load-config';
import { prerender } from './prerender';
import { resolveConfig, resolveMode } from './resolve-config';
import { parseArgs } from 'node:util';

const USAGE = `Usage: loom <build|dev|prerender> [options]

Options:
  --config <file>   Config file (default: loom.config.{ts,mts,js,mjs} in cwd)
  --mode <mode>     development | production (build defaults to production,
                    or development when NODE_ENV=development; dev is always
                    development)
  --outDir <dir>    Build directory (also LOOM_BUILD_DIR; default: build)
  -h, --help        Show this help`;

const COMMANDS = {
    build,
    dev,
    prerender
} as const;

type Command = keyof typeof COMMANDS;

const isCommand = (name: string): name is Command => name in COMMANDS;

export const cli = async (
    argv: string[],
    env: NodeJS.ProcessEnv = process.env
) => {
    const { positionals, values } = parseArgs({
        allowPositionals: true,
        args: argv,
        options: {
            config: { type: 'string' },
            help: { short: 'h', type: 'boolean' },
            mode: { type: 'string' },
            outDir: { type: 'string' }
        }
    });
    const [command] = positionals;

    if (values.help || !command) {
        console.info(USAGE);

        if (!command && !values.help) {
            process.exitCode = 1;
        }

        return;
    }

    if (!isCommand(command)) {
        throw new Error(`[loom] unknown command "${command}".\n\n${USAGE}`);
    }

    const cwd = process.cwd();
    const { config } = await loadConfig(cwd, values.config);
    const resolved = await resolveConfig(config, {
        cwd,
        mode: command === 'dev' ? 'development' : resolveMode(values.mode, env),
        outDir: values.outDir ?? env.LOOM_BUILD_DIR
    });

    await COMMANDS[command](resolved);
};
