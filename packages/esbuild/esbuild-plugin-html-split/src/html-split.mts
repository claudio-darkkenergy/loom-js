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
    isProd = false,
    entryPoints,
    prerender = false,
    routes = [],
    spa = true,
    template = getDefaultTemplate,
    verbose = false
} = {}) => ({
    name: 'html-split-plugin',
    setup(build) {
        const cache = new Map<string, Omit<HtmlTemplateArgs, 'define'>>();
        const options = build.initialOptions;
        const outdir = options.outdir || '/';

        options.metafile = true;
        console.info('HtmlSplit Plugin - Scoped Build Options:\n\n', {
            ...options
        });

        build.onEnd(async ({ metafile = {} }) => {
            const { outputs } = metafile as Partial<Metafile>;
            const isInitial = !cache.has(JSON.stringify(outputs));

            if (outputs) {
                const templateArgs =
                    cache.get(JSON.stringify(outputs)) ||
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

                cache.set(JSON.stringify(outputs), templateArgs);

                // Promises to create one HTML file per js bundle (`entryPoint`.)
                const htmlPromises =
                    spa && routes.length
                        ? routes.map((route) => {
                              const html = template({
                                  ...templateArgs,
                                  define,
                                  scope: route === '/' ? '/pages' : route
                              });
                              const out = path.join(
                                  outdir,
                                  `${route === '/' ? '' : route}/index.html`
                              );

                              return getHtmlPromise({
                                  html,
                                  isInitial,
                                  out
                              });
                          })
                        : templateArgs.js.map((js) => {
                              const basename =
                                  js.match(/\/([a-z0-9_-]+)\.js$/i)?.[1] || '';
                              const html = template({
                                  ...templateArgs,
                                  define,
                                  js: [js],
                                  scope: basename
                              });
                              const out = path.join(
                                  outdir,
                                  `${basename === 'pages' ? 'index' : `${basename}/index`}.html`
                              );

                              return getHtmlPromise({
                                  html,
                                  isInitial,
                                  out
                              });
                          });

                isInitial && console.info('Writing files...');
                await Promise.all(htmlPromises);
            }
        });
    }
});
