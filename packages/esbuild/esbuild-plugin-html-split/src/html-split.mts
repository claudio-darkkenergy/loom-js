import {
    checkIsEntryPoint,
    getDefaultTemplate,
    getDefaultTemplateArgs,
    getHtmlPromise,
    getResourcePath
} from './helpers.mjs';
import type { HtmlTemplateArgs, HtmlSplitPluginOptions } from './types.mjs';
import { Metafile, Plugin } from 'esbuild';
import path from 'node:path';

export const htmlSplit: (pluginOptions: HtmlSplitPluginOptions) => Plugin = ({
    define = {},
    entryPoints, // Possibly not needed, or just for some edge cases.
    isProd = false,
    main = '',
    prerender = false,
    routes = [],
    spa = '',
    template = getDefaultTemplate,
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
            const { outputs } = metafile as Partial<Metafile>;

            if (!outputs) {
                return;
            }

            const cacheKey = JSON.stringify(outputs);
            const isInitial = !cache.has(cacheKey);

            // Fetched from cache if possible.
            const templateArgs =
                cache.get(cacheKey) ||
                Object.entries(outputs).reduce<
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

            cache.set(cacheKey, templateArgs);
            console.log({ templateArgs });

            // Promises to create one HTML file per js bundle (`entryPoint`.)
            const htmlPromises =
                spa && routes.length
                    ? routes.map((route) => {
                          console.log({ route });
                          const html = template({
                              ...templateArgs,
                              define,
                              scope: route === '/' ? '/pages' : route
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
