interface DefineArgs {
    [key: string]: any;
}

export interface HtmlTemplateArgs {
    common: Omit<HtmlTemplateArgs, 'common' | 'define' | 'dynamic' | 'scope'>;
    css: string[];
    // JS chunks that are only ever reached through a dynamic `import()`
    // (targets of a `dynamic-import` edge). Never script-tag these by
    // default: eager evaluation runs them before whatever their importer
    // sequenced ahead of them. A template may opt route page chunks back in
    // as a preload.
    dynamic: { js: string[] };
    define: DefineArgs;
    js: string[];
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
