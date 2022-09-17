import * as path from 'path';
import { Compiler, WebpackError, WebpackPluginInstance } from 'webpack';
import {
    ssrServer,
    prerender,
    PrerenderOptions,
    PrerenderOutput
} from '../utils';

export interface PrerenderSsgWebpackPluginOptions extends PrerenderOptions {
    routes?: string[];
}

export default class PrerenderSsgWebpackPlugin
    implements WebpackPluginInstance
{
    private readonly defaultOptions: PrerenderSsgWebpackPluginOptions = {
        routes: ['/']
    };
    private readonly fallbackAssetPath = '/';
    private options: PrerenderSsgWebpackPluginOptions;

    /**
     * Prerenders one or more pages based on provided routes using Puppeteer.
     * @param options PrerenderSsgWebpackPluginOptions
     *
     * @example waitForTimeout `waitFor: 3000`
     * @example waitForSelector `waitFor: '#app'`
     * @example waitForFunction `waitFor: () => !!window.APP_READY`
     *      To manually trigger:
     *      @usage `window.APP_READY = true;`
     * @example `waitForManual: true`
     *      When this is set, `waitFor` will be ignored. This expects a manual trigger of the prerender snapshot from the client code.
     *      This is great for waiting for async resolution & enrichment of content to the page.
     *      To manually Trigger:
     *      @usage `if (window.snapshot) window.snapshot();`
     */
    constructor(options: PrerenderSsgWebpackPluginOptions = {}) {
        this.options = {
            ...this.defaultOptions,
            ...options
        };
    }

    // Define `apply` as its prototype method which is supplied with compiler as its argument
    apply(compiler: Compiler) {
        if (compiler.options.mode === 'development') {
            // Do nothing when in dev-mode.
            return;
        }

        compiler.hooks.afterEmit.tapAsync(
            'PrerenderWebpackPlugin',
            async (compilation, done) => {
                const {
                    output: { path: outputPath }
                } = compiler.options;
                const stats = compilation.getStats().toJson();
                const { port, routes, waitFor, waitForManual, waitUntil } =
                    this.options;
                let renderedPages: PrerenderOutput[] = [];
                // Start the server for prerendering.
                const server = await ssrServer({
                    assetPath: stats.publicPath || this.fallbackAssetPath,
                    inputPath: outputPath,
                    port,
                    routes
                });

                try {
                    // Prerender HTML.
                    renderedPages = await prerender({
                        port,
                        routes,
                        waitFor,
                        waitForManual,
                        waitUntil
                    });
                } catch (e) {
                    handleError(e, 'Failed at prerender.');
                    // Stop the server on errors.
                    server.close();
                }

                // Stop the server.
                server.close();
                // Write the files (filename based on route.)
                renderedPages.forEach(({ html, route }) => {
                    const staticFile = path.join(
                        outputPath,
                        route,
                        'index.html'
                    );

                    if (route !== '/') {
                        compiler.outputFileSystem.mkdir(
                            path.join(outputPath, route),
                            (err) =>
                                err &&
                                handleError(
                                    err,
                                    `Failed to make the ${route} directory.`
                                )
                        );
                    }
                    compiler.outputFileSystem.writeFile(
                        path.join(staticFile),
                        html,
                        (err) =>
                            err &&
                            handleError(
                                err,
                                `Failed to write the static file, ${staticFile}.`
                            )
                    );
                });
                // End the compilation.
                done();

                function handleError(
                    err: Error,
                    failedMsg = 'Uh oh, something went wrong.'
                ) {
                    console.error(` | ${failedMsg}`, err);
                    compilation.errors.push(err as WebpackError);
                }
            }
        );
    }
}
