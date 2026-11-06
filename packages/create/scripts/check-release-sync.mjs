// Fails when the pending changesets move a package the templates depend on
// out of the caret range `@loom-js/create` stamps, unless create releases too.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CREATE = '@loom-js/create';
// The workspace packages a template depends on, by directory.
export const TEMPLATE_PACKAGES = {
    '@loom-js/build': 'build',
    '@loom-js/core': 'core',
    '@loom-js/devtools': 'devtools',
    '@loom-js/pink': 'pink'
};

const BUMPS = ['patch', 'minor', 'major'];

/** The `"name": bump` pairs in a changeset file's frontmatter. */
export const parseChangeset = (text) => {
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

    return Object.fromEntries(
        frontmatter
            .split('\n')
            .map((line) =>
                line.match(/^\s*['"]?([^'":]+)['"]?\s*:\s*(\w+)\s*$/)
            )
            .filter(Boolean)
            .map(([, name, bump]) => [name.trim(), bump])
    );
};

/** The highest bump per package across changesets. */
export const pendingBumps = (changesets) => {
    const bumps = {};

    for (const changeset of changesets) {
        for (const [name, bump] of Object.entries(changeset)) {
            if (BUMPS.indexOf(bump) > BUMPS.indexOf(bumps[name])) {
                bumps[name] = bump;
            }
        }
    }

    return bumps;
};

const bumpVersion = (version, bump) => {
    const [major, minor, patch] = version.split('.').map(Number);

    return bump === 'major'
        ? `${major + 1}.0.0`
        : bump === 'minor'
          ? `${major}.${minor + 1}.0`
          : `${major}.${minor}.${patch + 1}`;
};

/** Whether `candidate` satisfies `^base` (npm caret rules). */
export const satisfiesCaret = (base, candidate) => {
    const [baseMajor, baseMinor, basePatch] = base.split('.').map(Number);
    const [major, minor, patch] = candidate.split('.').map(Number);

    if (baseMajor > 0) {
        return major === baseMajor;
    }

    if (baseMinor > 0) {
        return major === 0 && minor === baseMinor && patch >= basePatch;
    }

    return major === 0 && minor === 0 && patch === basePatch;
};

/** Template packages whose pending version leaves the stamped range. */
export const findDrift = (bumps, versions) => {
    if (bumps[CREATE]) {
        return [];
    }

    return Object.entries(bumps)
        .filter(([name]) => name in versions)
        .map(([name, bump]) => ({
            from: versions[name],
            name,
            to: bumpVersion(versions[name], bump)
        }))
        .filter(({ from, to }) => !satisfiesCaret(from, to));
};

const main = async () => {
    const workspace = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../..'
    );
    const changesetDirectory = path.join(workspace, '.changeset');
    const files = (await readdir(changesetDirectory)).filter(
        (file) => file.endsWith('.md') && file !== 'README.md'
    );
    const changesets = await Promise.all(
        files.map(async (file) =>
            parseChangeset(
                await readFile(path.join(changesetDirectory, file), 'utf8')
            )
        )
    );
    const versions = Object.fromEntries(
        await Promise.all(
            Object.entries(TEMPLATE_PACKAGES).map(async ([name, directory]) => {
                const manifest = JSON.parse(
                    await readFile(
                        path.join(
                            workspace,
                            'packages',
                            directory,
                            'package.json'
                        ),
                        'utf8'
                    )
                );

                return [name, manifest.version];
            })
        )
    );
    const drift = findDrift(pendingBumps(changesets), versions);

    if (drift.length > 0) {
        console.error(
            [
                `[release-sync] ${drift
                    .map(({ from, name, to }) => `${name} ${from} → ${to}`)
                    .join(
                        ', '
                    )} ${drift.length === 1 ? 'leaves' : 'leave'} the range ${CREATE} stamps.`,
                `Add a ${CREATE} changeset (and update the templates if the API moved), so the published scaffolder targets the new version.`
            ].join('\n')
        );
        process.exitCode = 1;

        return;
    }

    console.info('[release-sync] the scaffolder is in step with the release.');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await main();
}
