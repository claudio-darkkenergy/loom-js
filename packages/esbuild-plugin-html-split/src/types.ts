interface DefineArgs {
    [key: string]: any;
}

/**
 * What a shell template receives, per emitted HTML file. Every path is a
 * site-absolute URL (the esbuild `outdir` prefix stripped).
 */
export interface HtmlTemplateArgs {
    /**
     * Resources shared by every shell: JS chunks that are neither an entry
     * point nor a dynamic-import target, and CSS bundles that belong to no
     * entry point.
     */
    common: Omit<
        HtmlTemplateArgs,
        'common' | 'define' | 'dynamic' | 'routeAssets' | 'routeCss' | 'scope'
    >;
    /** The entry stylesheet(s) — shared CSS only, once route CSS is split out. */
    css: string[];
    /**
     * JS chunks that are only ever reached through a dynamic `import()`
     * (targets of a `dynamic-import` edge). Never script-tag these by
     * default: eager evaluation runs them before whatever their importer
     * sequenced ahead of them. A template may opt route page chunks back in
     * as a preload.
     */
    dynamic: { js: string[] };
    /** The plugin's `define` option, passed through untouched. */
    define: DefineArgs;
    /** The entry-point JS bundle(s) this shell boots. */
    js: string[];
    /**
     * The route-assets manifest: route pattern -> that route's CSS bundle
     * URLs. Templates inline it for the runtime loader.
     */
    routeAssets: Record<string, string[]>;
    /**
     * The CSS bundles owned by this shell's own route — linked by scoped
     * prod shells so hard loads need no runtime fetch. Empty in dev.
     */
    routeCss: string[];
    /**
     * The chunk-name scope of the route this shell serves (`routeScopeOf`),
     * or the entry basename in multi-entry mode.
     */
    scope: string;
}

export interface HtmlSplitPluginOptions {
    /** Arbitrary values handed to the template as `args.define`. */
    define?: DefineArgs;
    /**
     * Entry-point names (output paths without `/` and `.js`) to treat as
     * shells. With `spa` set, naming the SPA entry here makes the plugin
     * classify the route chunks as common/dynamic resources instead of
     * extra entries.
     */
    entryPoints?: string[];
    /**
     * Production mode: scoped shells link their own route CSS. Dev shells
     * leave route CSS to the runtime loader so that path is exercised.
     */
    isProd?: boolean;
    /**
     * Multi-entry mode only: the entry whose shell lands at the outdir root
     * (`index.html`). Defaults to the entry named `index`.
     */
    main?: string;
    /** SPA mode: the routes to emit a shell for (`/` -> `index.html`, `/docs` -> `docs/index.html`). */
    routes?: string[];
    /** SPA mode: the single entry point's output name, e.g. `static/js/spa`. */
    spa?: string;
    /** The shell template. Defaults to a minimal head/body shell. */
    template?: (args: HtmlTemplateArgs) => string;
    /**
     * Rebuild once with synthetic css entries so one mangle pool names the
     * js and every stylesheet — enables full identifier minification at
     * roughly double the build time. Off by default.
     */
    twoPassCss?: boolean;
    /** Log the scoped build options and template args. */
    verbose?: boolean;
}
