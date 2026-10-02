import type { HtmlTemplateArgs, HtmlSplitPluginOptions } from './types';
import { realpathSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const getDefaultTemplate = (args: HtmlTemplateArgs) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
${args.common.css
    .concat(args.css)
    .concat(args.routeCss)
    .map((path) => `    <link href="${path}" rel="stylesheet" />`)
    .join('\n')}
    <script>window.__ROUTE_ASSETS__ = ${JSON.stringify(args.routeAssets)}</script>
${args.common.js
    .concat(args.js)
    .map((path) => `    <script defer src="${path}" type="module"></script>`)
    .join('\n')}
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
</body>
</html>
`;

export type MetafileImportKind =
    | 'entry-point'

    // JS
    | 'import-statement'
    | 'require-call'
    | 'dynamic-import'
    | 'require-resolve'

    // CSS
    | 'import-rule'
    | 'composes-from'
    | 'url-token';

export interface MetafileOutputMeta {
    bytes: number;
    inputs: {
        [path: string]: {
            bytesInOutput: number;
        };
    };
    imports: {
        path: string;
        kind: MetafileImportKind | 'file-loader';
        external?: boolean;
    }[];
    exports: string[];
    entryPoint?: string;
    cssBundle?: string;
}

export const checkIsEntryPoint = ({
    entryPoints,
    meta,
    resourcePath,
    spa = ''
}: Pick<HtmlSplitPluginOptions, 'entryPoints' | 'spa'> & {
    meta: MetafileOutputMeta;
    resourcePath: string;
}) => {
    switch (true) {
        // Handle implicit entry-points - dynamically pull from output metafile.
        case /\.css$/.test(resourcePath) || !entryPoints?.length:
            return Boolean(meta.entryPoint);
        // Handle SPA (single entry-point.)
        case Boolean(spa):
            return new RegExp(`${spa}.js`).test(resourcePath);
        // Handle explicit entry-points (defined in plugin options.)
        case Boolean(entryPoints?.length):
            return entryPoints.includes(
                resourcePath.match(/^\/(.+)\.js$/i)?.[1] || ''
            );
        default:
            return false;
    }
};

export const getDefaultTemplateArgs = (): Omit<HtmlTemplateArgs, 'define'> => ({
    common: { css: [], js: [] },
    css: [],
    dynamic: { js: [] },
    js: [],
    routeAssets: {},
    routeCss: [],
    scope: ''
});

export const getHtmlPromise = ({
    html,
    isInitial,
    out
}: {
    html: string;
    isInitial: boolean;
    out: string;
}) =>
    new Promise<string>(async (resolve) => {
        await mkdir(path.dirname(out), {
            recursive: true
        });
        await writeFile(out, html);
        isInitial && console.info(`> ${out} - ${(await stat(out)).size} bytes`);
        resolve(html);
    });

// Symlinked directories (macOS's `/var` -> `/private/var`) would otherwise
// make a metafile path and the outdir disagree on their common prefix.
const realPathOf = (filePath: string) => {
    try {
        return realpathSync.native(filePath);
    } catch {
        return filePath;
    }
};

/**
 * A site-absolute URL for an output: its path relative to the outdir. Both
 * resolve against the build's working directory — the base of esbuild's
 * metafile paths — so an outdir outside the project works.
 */
export const getResourcePath = ({
    cwd,
    outdir,
    path: resourcePath
}: {
    cwd: string;
    outdir: string;
    path: string;
}) =>
    `/${path
        .relative(
            realPathOf(path.resolve(cwd, outdir)),
            realPathOf(path.resolve(cwd, resourcePath))
        )
        .split(path.sep)
        .join('/')}`;
