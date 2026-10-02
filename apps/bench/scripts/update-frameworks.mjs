// `pnpm bench:update`: bump the competitor frameworks (and their esbuild
// compiler plugins) to their latest releases in the bench manifest + lockfile,
// then print what moved. The commit this produces is what makes the next
// build remeasure — nothing resolves `latest` at build time.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const benchRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
const require = createRequire(path.join(benchRoot, 'noop.js'));

const PACKAGES = [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    'vue',
    'svelte',
    'solid-js',
    'esbuild-svelte',
    'esbuild-plugin-solid'
];

// Walks up from the resolved entry to the package's own manifest — the
// `exports` maps of several of these hide `package.json`.
const installedVersion = (packageName) => {
    let directory;

    try {
        directory = path.dirname(require.resolve(packageName));
    } catch {
        return undefined;
    }

    while (directory !== path.dirname(directory)) {
        try {
            const manifest = JSON.parse(
                readFileSync(path.join(directory, 'package.json'), 'utf8')
            );

            if (manifest.name === packageName) {
                return manifest.version;
            }
        } catch {
            // No manifest at this level — keep walking.
        }

        directory = path.dirname(directory);
    }

    return undefined;
};

const before = Object.fromEntries(
    PACKAGES.map((name) => [name, installedVersion(name)])
);

execFileSync('pnpm', ['update', '--latest', ...PACKAGES], {
    cwd: benchRoot,
    stdio: 'inherit'
});

let moved = 0;

for (const name of PACKAGES) {
    const after = installedVersion(name);

    if (after !== before[name]) {
        moved += 1;
        console.info(`${name}: ${before[name] ?? '—'} → ${after ?? '—'}`);
    }
}

console.info(
    moved
        ? `${moved} package(s) moved — commit apps/bench/package.json and pnpm-lock.yaml to remeasure.`
        : 'Every framework is already at its latest release.'
);
