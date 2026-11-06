// The CLI's edges — terminal and child processes — as interfaces, so tests
// drive the whole flow without a TTY, a network or a real git.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

export interface Io {
    /** Whether prompts may be shown: stdin and stdout are both a TTY. */
    interactive: boolean;
    print: (text: string) => void;
    error: (text: string) => void;
    /** Asks one question; only called when `interactive`. */
    ask: (question: string) => Promise<string>;
    close: () => void;
}

export interface SpawnResult {
    /** The exit code, or `null` when the command could not start. */
    code: number | null;
    stdout: string;
    stderr: string;
}

export interface SpawnOptions {
    cwd: string;
    /** Stream output to the terminal instead of capturing it. */
    inherit?: boolean;
}

export type Spawn = (
    command: string,
    args: readonly string[],
    options: SpawnOptions
) => Promise<SpawnResult>;

/** The terminal `Io`. */
export const nodeIo = (): Io => {
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    let readline: ReturnType<typeof createInterface> | undefined;

    return {
        ask: (question) => {
            readline ??= createInterface({
                input: process.stdin,
                output: process.stdout
            });

            return readline.question(question);
        },
        close: () => readline?.close(),
        error: (text) => console.error(text),
        interactive,
        print: (text) => console.info(text)
    };
};

/** The child-process `Spawn`. */
export const nodeSpawn: Spawn = (command, args, { cwd, inherit }) =>
    new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        const child = spawn(command, args, {
            cwd,
            // Package managers are `.cmd` shims on Windows.
            shell: process.platform === 'win32',
            stdio: inherit ? 'inherit' : 'pipe'
        });

        child.stdout?.on('data', (chunk) => (stdout += chunk));
        child.stderr?.on('data', (chunk) => (stderr += chunk));
        child.on('error', () => resolve({ code: null, stderr, stdout }));
        child.on('close', (code) => resolve({ code, stderr, stdout }));
    });
