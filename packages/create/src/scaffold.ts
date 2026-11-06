// The whole scaffold as a file map (path → content, relative to the target),
// so it can be tested without a disk. Template layers supply the app's
// static files; the renderers supply everything more than one choice shapes.
import { toJson } from './json';
import { type LayerReader, layerNamesFor, mergeLayers } from './layers';
import { renderBootstrap } from './render/bootstrap';
import {
    COMPILER_OPTIONS,
    renderCompilerConfig
} from './render/compiler-config';
import { appScripts, type RenderContext } from './render/context';
import { renderLoomConfig } from './render/loom-config';
import {
    renderAppPackageJson,
    renderRootPackageJson
} from './render/package-json';
import {
    renderGitignore,
    renderPnpmWorkspace,
    renderReadme,
    renderYarnrc
} from './render/repo-files';
import { renderTailwindStyles } from './render/styles';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MONOREPO_APP_DIR = 'apps/web';

export interface ScaffoldOptions {
    /** `name@version` for the root `packageManager` field (monorepo only). */
    packageManagerField?: string;
    /** The invoking package manager's version, for yarn's linker setting. */
    packageManagerVersion?: string;
}

type Files = Record<string, string>;

// `files` when `condition` holds, nothing otherwise.
const when = (condition: boolean, files: () => Files): Files =>
    condition ? files() : {};

const prefixed = (prefix: string, files: Files) =>
    Object.fromEntries(
        Object.entries(files).map(([filePath, content]) => [
            prefix ? `${prefix}/${filePath}` : filePath,
            content
        ])
    );

/** The app directory's files, the same in both layouts. */
const appFiles = async (
    context: RenderContext,
    readLayer: LayerReader
): Promise<Files> => {
    const { choices } = context;
    const layers = await Promise.all(
        layerNamesFor(choices).map((name) => readLayer(name))
    );
    const extension = choices.js ? 'js' : 'ts';

    return {
        ...mergeLayers(layers),
        [choices.js ? 'loom.config.mjs' : 'loom.config.ts']:
            renderLoomConfig(context),
        'package.json': renderAppPackageJson(context),
        [`src/bootstrap.${extension}`]: renderBootstrap(context),
        ...when(choices.tailwind, () => ({
            'src/styles.css': renderTailwindStyles(context)
        })),
        ...renderCompilerConfig(context)
    };
};

/** Files the repository root owns, in both layouts. */
const repoFiles = (
    context: RenderContext,
    options: ScaffoldOptions
): Files => ({
    '.gitignore': renderGitignore(context),
    'README.md': renderReadme(context),
    ...(context.formatter?.files({
        ignored:
            context.choices.layout === 'monorepo'
                ? (context.taskRunner?.gitignore ?? [])
                : []
    }) ?? {}),
    ...when(context.packageManager.name === 'pnpm', () => ({
        'pnpm-workspace.yaml': renderPnpmWorkspace(context)
    })),
    ...when(context.packageManager.name === 'yarn', () =>
        renderYarnrc(options.packageManagerVersion)
    )
});

/** The workspace root of a monorepo, around `apps/web`. */
const workspaceFiles = (
    context: RenderContext,
    options: ScaffoldOptions
): Files => {
    const { choices, taskRunner } = context;
    const delegated = appScripts(context);

    return {
        'package.json': renderRootPackageJson(
            context,
            delegated,
            options.packageManagerField
        ),
        ...when(!choices.js, () => ({
            'tsconfig.base.json': toJson({ compilerOptions: COMPILER_OPTIONS })
        })),
        ...(taskRunner?.rootFiles({ scripts: delegated }) ?? {}),
        'packages/.gitkeep': ''
    };
};

/** Every file the scaffold writes, by path relative to the target. */
export const planScaffold = async (
    context: RenderContext,
    readLayer: LayerReader,
    options: ScaffoldOptions = {}
): Promise<Files> => {
    const app = await appFiles(context, readLayer);

    if (context.choices.layout === 'single') {
        return { ...app, ...repoFiles(context, options) };
    }

    return {
        ...prefixed(MONOREPO_APP_DIR, app),
        ...repoFiles(context, options),
        ...workspaceFiles(context, options)
    };
};

/** Writes a planned scaffold under `directory`. */
export const writeScaffold = async (directory: string, files: Files) => {
    for (const [filePath, content] of Object.entries(files)) {
        const absolute = path.join(directory, ...filePath.split('/'));

        await mkdir(path.dirname(absolute), { recursive: true });
        await writeFile(absolute, content);
    }
};
