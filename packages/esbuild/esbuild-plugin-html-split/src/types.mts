interface DefineArgs {
    [key: string]: any;
}

export interface HtmlTemplateArgs {
    common: Omit<
        HtmlTemplateArgs,
        'common' | 'define' | 'dynamic' | 'routeAssets' | 'routeCss' | 'scope'
    >;
    css: string[];
    // JS chunks that are only ever reached through a dynamic `import()`
    // (targets of a `dynamic-import` edge). Never script-tag these by
    // default: eager evaluation runs them before whatever their importer
    // sequenced ahead of them. A template may opt route page chunks back in
    // as a preload.
    dynamic: { js: string[] };
    define: DefineArgs;
    js: string[];
    // The route-assets manifest: route pattern -> that route's CSS bundle
    // URLs. Templates inline it for the runtime loader.
    routeAssets: Record<string, string[]>;
    // The CSS bundles owned by this shell's own route — linked by scoped
    // prod shells so hard loads need no runtime fetch.
    routeCss: string[];
    scope: string;
}

export interface HtmlSplitPluginOptions {
    define?: DefineArgs;
    entryPoints?: string[];
    isProd?: boolean;
    main?: string;
    prerender?: boolean;
    routes?: string[];
    spa?: string;
    template?: (args: HtmlTemplateArgs) => string;
    verbose?: boolean;
}
