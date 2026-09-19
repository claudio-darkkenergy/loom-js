import { Metafile, Plugin } from 'esbuild';

import {
    checkIsEntryPoint,
    getDefaultTemplate,
    getDefaultTemplateArgs,
    getHtmlPromise,
    getResourcePath
} from './helpers.mjs';
import {
    analyzeRouteCss,
    applyRouteScopedCss,
    applyTwoPassCss,
    routeScopeOf
} from './route-css.mjs';
import type { HtmlTemplateArgs, HtmlSplitPluginOptions } from './types.mjs';
import path from 'node:path';

export const htmlSplit: (pluginOptions: HtmlSplitPluginOptions) => Plugin = ({
    define = {},
    entryPoints, // Possibly not needed, or just for some edge cases.
    isProd = false,
    main = '',
    routes = [],
    spa = '',
    template = getDefaultTemplate,
    twoPassCss = false,
    verbose = false
} = {}) => ({
    name: 'html-split-plugin',
    setup(build) {
        const cache = new Map<string, Omit<HtmlTemplateArgs, 'define'>>();
        const options = build.initialOptions;
        const outdir = options.outdir || '/';

        options.metafile = true;
        verbose &&
            console.info('HtmlSplit Plugin - Scoped Build Options:\n\n', {
                ...options
            });

        build.onEnd(async ({ metafile = {} }) => {
            const { inputs = {}, outputs } = metafile as Partial<Metafile>;

            if (!outputs) {
                return;
            }

            const cacheKey = JSON.stringify(outputs);
            const isInitial = !cache.has(cacheKey);

            // CSS bundles belonging to dynamically-imported JS chunks — their
            // content is already contained in the importing entry's CSS
            // bundle, since esbuild does not code-split CSS. They must not be
            // linked. (Dynamic chunks can't be told apart by `entryPoint` —
            // esbuild marks them as sub-entry points too — so detect them as
            // targets of a `dynamic-import` edge from another output.)
            const findDynamicChunks = (from: Metafile['outputs']) =>
                new Set(
                    Object.values(from).flatMap((meta) =>
                        meta.imports
                            .filter(({ kind }) => kind === 'dynamic-import')
                            .map(({ path: importPath }) => importPath)
                    )
                );
            const classify = (from: Metafile['outputs']) => {
                const dynamicChunks = findDynamicChunks(from);
                const dynamicChunkCssBundles = new Set(
                    Object.entries(from).flatMap(([outputPath, meta]) =>
                        dynamicChunks.has(outputPath) && meta.cssBundle
                            ? [
                                  getResourcePath({
                                      outdir,
                                      path: meta.cssBundle
                                  })
                              ]
                            : []
                    )
                );

                return Object.entries(from).reduce<
                    Omit<HtmlTemplateArgs, 'define'>
                >((acc, [outputPath, meta]) => {
                    const resourcePath = getResourcePath({
                        outdir,
                        path: outputPath
                    });
                    const isEntryPoint = checkIsEntryPoint({
                        entryPoints,
                        meta,
                        resourcePath,
                        spa
                    });
                    const isCss = /\.css$/.test(outputPath);
                    const isJs = /\.js$/.test(outputPath);

                    if (isCss && dynamicChunkCssBundles.has(resourcePath)) {
                        return acc;
                    }

                    // Dynamic-import targets load on demand from their
                    // importer; surfaced separately so templates can choose
                    // to preload route chunks without eagerly evaluating
                    // everything that is `import()`ed (e.g. grammar modules
                    // that depend on an importer-sequenced global).
                    if (isJs && dynamicChunkPaths.has(outputPath)) {
                        acc.dynamic.js.push(resourcePath);
                        return acc;
                    }

                    if (isEntryPoint && isJs) {
                        acc.js.push(resourcePath);
                    } else if (isEntryPoint && isCss) {
                        acc.css.push(resourcePath);
                    } else if (isJs) {
                        acc.common.js.push(resourcePath);
                    } else if (isCss) {
                        acc.common.css.push(resourcePath);
                    }

                    return acc;
                }, getDefaultTemplateArgs());
            };

            const dynamicChunkPaths = findDynamicChunks(outputs);
            const plan = analyzeRouteCss({
                dynamicChunkPaths,
                inputs,
                outputs,
                routes,
                spa
            });
            let templateArgs: Omit<HtmlTemplateArgs, 'define'>;

            if (twoPassCss) {
                // One rebuild with synthetic css entries: a single mangle
                // pool names the js and every stylesheet, so full
                // identifier minification stays sound. Shells emit from
                // pass 2's outputs.
                const passTwo = await applyTwoPassCss({
                    initialOptions: options,
                    outdir,
                    passOneOutputs: outputs,
                    plan
                });

                templateArgs = classify(passTwo.outputs);
                templateArgs.routeAssets = passTwo.routeAssets;
            } else {
                // Single-pass rewrites regenerate css-module names in a
                // separate build — under identifier minification those can
                // never match the names already emitted in the js. Fail
                // loudly instead of shipping silently broken styles.
                const rewritesModuleCss = [
                    ...plan.sharedInputs,
                    ...plan.bundles.flatMap(({ ownedInputs }) => ownedInputs)
                ].some((input) => /\.module\.css$/.test(input));

                if (
                    rewritesModuleCss &&
                    (options.minify || options.minifyIdentifiers)
                ) {
                    throw new Error(
                        '[html-split] css-module names are not build-stable under identifier minification. Enable `twoPassCss: true`, or build with `minifyWhitespace`/`minifySyntax` instead of `minify`.'
                    );
                }

                templateArgs = cache.get(cacheKey) ?? classify(outputs);
                templateArgs.routeAssets = await applyRouteScopedCss({
                    buildOptions: options,
                    outdir,
                    plan
                });
            }

            cache.set(cacheKey, templateArgs);
            console.log({ templateArgs: JSON.stringify(templateArgs) });

            // Promises to create one HTML file per js bundle (`entryPoint`.)
            const htmlPromises =
                spa && routes.length
                    ? routes.map((route) => {
                          console.log({ route });
                          const html = template({
                              ...templateArgs,
                              define,
                              // Scoped prod shells link their own route CSS;
                              // dev's superset shell leaves it to the runtime
                              // loader so that path is exercised constantly.
                              routeCss: isProd
                                  ? (templateArgs.routeAssets[route] ?? [])
                                  : [],
                              scope: routeScopeOf(route)
                          });
                          const out = path.join(
                              outdir,
                              route === '/' ? '' : route,
                              '/index.html'
                          );

                          return getHtmlPromise({
                              html,
                              isInitial,
                              out
                          });
                      })
                    : templateArgs.js.map((js) => {
                          const basename = js.match(/^(.+)\.js$/)?.[1] || '';
                          console.log({ js });
                          const html = template({
                              ...templateArgs,
                              define,
                              js: [js],
                              scope: basename
                          });
                          const out = path.join(
                              outdir,
                              (
                                  main
                                      ? new RegExp(`\/${main}.js$`).test(js)
                                      : /\/index.js$/.test(js)
                              )
                                  ? ''
                                  : basename,
                              '/index.html'
                          );

                          return getHtmlPromise({
                              html,
                              isInitial,
                              out
                          });
                      });

            isInitial && console.info('Writing files...');
            await Promise.all(htmlPromises);
        });
    }
});
