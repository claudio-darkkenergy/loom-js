// The public config surface. Every field here is bundler-neutral; `esbuild`
// is the one named escape hatch, applied after every tool default.
import type { HtmlTemplateArgs } from '@loom-js/esbuild-plugin-html-split';
import type { BuildOptions } from 'esbuild';

export type Mode = 'development' | 'production';

export interface ConfigEnv {
    mode: Mode;
}

/** A value for `define` — serialized with `JSON.stringify` into the bundle. */
export type DefineValue = string | number | boolean | null;

export interface CopyAsset {
    /** A glob, relative to `root`. */
    from: string;
    /** A directory relative to `outDir`. */
    to: string;
}

export interface HtmlOptions {
    /** The `<title>` per shell, keyed by the shell's route scope. */
    title?: (scope: string) => string;
    /** Extra markup inserted at the top of `<head>`, before the stylesheets. */
    head?: (args: HtmlTemplateArgs) => string;
    /** Class names on `<body>` — e.g. a theme class the prerendered markup needs before boot. */
    bodyClass?: string;
    /** Replaces the default shell template entirely. */
    template?: (args: HtmlTemplateArgs) => string;
}

export interface ServerOptions {
    /** Dev server port. Default `3000`. */
    port?: number;
    /** Dev server host. Default: every interface. */
    host?: string;
}

/**
 * The prerender bundle's exports, as loaded from `outDir`. Only
 * `prerenderRoute` is required; the rest is whatever the entry exports, for
 * the hooks to use.
 */
export interface PrerenderBundle {
    prerenderRoute: (
        url: string,
        window: object
    ) => Promise<PrerenderOutput> | PrerenderOutput;
    [exportName: string]: unknown;
}

export interface PrerenderOutput {
    /** The route's rendered markup, from `renderToString`. */
    html: string;
    /** The route's dehydrated state, from `serializeState`. */
    state: string;
}

export interface PrerenderContext {
    /** The absolute build directory. */
    outDir: string;
    bundle: PrerenderBundle;
}

export interface PrerenderOptions<
    Bundle extends PrerenderBundle = PrerenderBundle
> {
    /**
     * The module built as `static/js/prerender` alongside the client — same
     * build, so css-module names and the core instance match the shipped
     * app. Must export `prerenderRoute(url, window)`.
     */
    entry: string;
    /** Runs once, before route enumeration — e.g. point data providers at their build-time transport. */
    setup?: (bundle: Bundle) => void | Promise<void>;
    /** The routes to prerender. Each resolves to the shell of its longest configured route prefix. */
    routes: (bundle: Bundle) => string[] | Promise<string[]>;
    /** Throw to fail the build for a route whose output is not what the app expects. */
    validate?: (
        route: string,
        output: PrerenderOutput,
        bundle: Bundle
    ) => void | Promise<void>;
    /** Runs once after every route is written — e.g. emit extra files from the same bundle. */
    after?: (
        context: PrerenderContext & { bundle: Bundle }
    ) => void | Promise<void>;
    /**
     * Preload every `.woff2` the build emitted from the shells' `<head>`.
     * Fonts are otherwise only discoverable through CSS `url()`s, which
     * puts their download after first paint. Default `false`.
     */
    preloadFonts?: boolean;
}

export interface LoomConfig<
    Bundle extends PrerenderBundle = PrerenderBundle
> {
    /** The project root. Default: the config file's directory. */
    root?: string;
    /** The build directory, relative to `root`. Default `build`. */
    outDir?: string;
    /** The browser entry module. Emitted as `static/js/spa`. */
    entry: string;
    /** Standalone stylesheets. Each is emitted as `static/styles/<basename>`. */
    styles?: string[];
    /** The routes that get a shell. Default `['/']`. */
    routes?: string[];
    /** Compile-time constants. Values are JSON-encoded; `__DEV__` is set by the tool. */
    define?: Record<string, DefineValue>;
    /** A directory copied verbatim to `<outDir>/static`. */
    publicDir?: string;
    /** Extra copies. */
    copy?: CopyAsset[];
    html?: HtmlOptions;
    server?: ServerOptions;
    prerender?: PrerenderOptions<Bundle>;
    /** The escape hatch: edit the final esbuild options. Applied last. */
    esbuild?: (options: BuildOptions, env: ConfigEnv) => BuildOptions;
}

export type LoomConfigExport<
    Bundle extends PrerenderBundle = PrerenderBundle
> =
    | LoomConfig<Bundle>
    | ((env: ConfigEnv) => LoomConfig<Bundle> | Promise<LoomConfig<Bundle>>);

/** Types the config and keeps the function form's `env` inferred. */
export const defineConfig = <Bundle extends PrerenderBundle = PrerenderBundle>(
    config: LoomConfigExport<Bundle>
) => config;

/** The config with every default filled in and `root`/`outDir` absolute. */
export interface ResolvedConfig extends Required<
    Pick<LoomConfig, 'root' | 'outDir' | 'entry' | 'styles' | 'routes'>
> {
    mode: Mode;
    define: Record<string, DefineValue>;
    publicDir?: string;
    copy: CopyAsset[];
    html: HtmlOptions;
    server: Required<Pick<ServerOptions, 'port'>> & ServerOptions;
    prerender?: PrerenderOptions;
    esbuild?: LoomConfig['esbuild'];
}

export interface ResolveOptions {
    mode: Mode;
    /** Where relative `root` resolves from. Default `process.cwd()`. */
    cwd?: string;
    /** Overrides `config.outDir` (the `--outDir` flag / `LOOM_BUILD_DIR`). */
    outDir?: string;
}
