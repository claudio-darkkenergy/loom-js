import type { HtmlTemplateArgs, HtmlSplitPluginOptions } from './types.mjs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const getDefaultTemplate = (args: HtmlTemplateArgs) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
${args.common.css
    .concat(args.css)
    .map((path) => `    <link href="${path}" rel="stylesheet" />`)
    .join('\n')}
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
    spa
}: Pick<HtmlSplitPluginOptions, 'entryPoints' | 'spa'> & {
    meta: MetafileOutputMeta;
    resourcePath: string;
}) => {
    if (typeof meta === 'string') {
        return false;
    }

    switch (true) {
        // Dynamically pull from output metafile.
        case /\.css$/.test(resourcePath) || !entryPoints?.length:
            return Boolean(meta.entryPoint);
        // Handle SPA (single entry-point.)
        case Boolean(spa && entryPoints?.length):
            return resourcePath.match(/^\/(.+)\.js$/i)?.[1] === entryPoints[0];
        // Handle explicit entry-points.
        case Boolean(entryPoints?.length):
            return entryPoints.includes(
                resourcePath.match(/\/([a-z0-9_-]+)\.js$/i)?.[1] || ''
            );
        default:
            return false;
    }
};

export const getDefaultTemplateArgs = (): Omit<HtmlTemplateArgs, 'define'> => ({
    common: { css: [], js: [] },
    css: [],
    js: [],
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

export const getResourcePath = ({
    outdir,
    path
}: {
    outdir: string;
    path: string;
}) => {
    const outdirTrimRe = /^(\.\/|\/)/i;
    const replacer = outdir.replace(outdirTrimRe, '');

    return path.replace(replacer, '');
};
