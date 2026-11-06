// `dev`: the Tailwind CLI in watch mode next to `loom dev`. When either one
// exits, the other is stopped, and its exit code is passed on.

import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TASKS = [
    [
        'tailwindcss',
        // `always`: plain `--watch` exits when stdin closes (any non-TTY run).
        [
            '-i',
            './src/styles.css',
            '-o',
            './.generated/styles.css',
            '--watch=always'
        ]
    ],
    ['loom', ['dev']]
];

/** Starts every task; resolves with the first exit code once all stopped. */
export const runTogether = (tasks, start = spawn) =>
    new Promise((resolve) => {
        let exitCode;
        const stopped = new Set();
        const children = tasks.map(([command, args]) =>
            start(command, args, {
                // Package binaries are `.cmd` shims on Windows.
                shell: process.platform === 'win32',
                stdio: 'inherit'
            })
        );
        const onStopped = (child, code) => {
            if (stopped.has(child)) {
                return;
            }

            stopped.add(child);
            exitCode ??= code ?? 1;

            for (const other of children) {
                if (!stopped.has(other)) {
                    other.kill();
                }
            }

            if (stopped.size === children.length) {
                resolve(exitCode);
            }
        };

        for (const child of children) {
            child.on('exit', (code) => onStopped(child, code));
            // A binary that can't start stops the other task too.
            child.on('error', () => onStopped(child, 1));
        }
    });

// Runs only as the `dev` script, not when imported.
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = await runTogether(TASKS);
}
