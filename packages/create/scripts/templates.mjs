// The template trees a scaffold copies from: the source layers per
// formatter and language, the JS tree with types erased, each formatted with
// that formatter's shipped config so a scaffold passes its own check as is.
import { execFile } from 'node:child_process';
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

// Strip mode keeps every line in place. A `//` comment block directly above
// a line that erased completely documented that type syntax, so it goes too.
export const eraseTypes = (source) => {
    const before = source.split('\n');
    const after = stripTypeScriptTypes(source, { mode: 'strip' }).split('\n');

    before.forEach((line, index) => {
        if (line.trim() === '' || after[index].trim() !== '') {
            return;
        }

        for (
            let above = index - 1;
            above >= 0 && after[above].trim().startsWith('//');
            above -= 1
        ) {
            after[above] = '';
        }
    });

    return after.join('\n');
};

// Every `.ts` file becomes `.js` with its types erased; strip mode throws on
// syntax that needs a transform (enums, namespaces), which fails the build.
const stripTypes = async (tree) => {
    const entries = await readdir(tree, {
        recursive: true,
        withFileTypes: true
    });

    for (const entry of entries.filter((item) => item.isFile())) {
        const file = path.join(entry.parentPath, entry.name);

        if (file.endsWith('.d.ts')) {
            await rm(file);
        } else if (file.endsWith('.ts')) {
            const source = await readFile(file, 'utf8');

            await writeFile(file.replace(/\.ts$/, '.js'), eraseTypes(source));
            await rm(file);
        }
    }
};

// Formats `tree` the way a scaffold with `formatter` checks itself.
const formatTree = async (tree, formatter, binDirectory) => {
    const configFiles = Object.entries(formatter.files({ ignored: [] }));
    const [fixBin, ...fixArgs] = formatter.fixCommand;
    const [checkBin, ...checkArgs] = formatter.checkCommand;

    for (const [file, content] of configFiles) {
        await writeFile(path.join(tree, file), content);
    }

    await run(path.join(binDirectory, fixBin), fixArgs, { cwd: tree });
    await run(path.join(binDirectory, checkBin), checkArgs, { cwd: tree });

    for (const [file] of configFiles) {
        await rm(path.join(tree, file));
    }
};

/** Writes `<outDirectory>/<formatter>/<ts|js>/` from the source layers. */
export const buildTemplates = async ({
    binDirectory,
    formatters,
    outDirectory,
    sourceDirectory
}) => {
    for (const formatter of formatters) {
        for (const language of ['ts', 'js']) {
            const tree = path.join(outDirectory, formatter.id, language);

            await cp(sourceDirectory, tree, { recursive: true });

            if (language === 'js') {
                await stripTypes(tree);
            }

            await formatTree(tree, formatter, binDirectory);
        }
    }
};
