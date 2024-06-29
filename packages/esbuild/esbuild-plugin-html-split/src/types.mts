interface DefineArgs {
    [key: string]: any;
}

export interface HtmlTemplateArgs {
    common: Omit<HtmlTemplateArgs, 'common' | 'define' | 'scope'>;
    css: string[];
    define: DefineArgs;
    js: string[];
    scope: string;
}

export interface HtmlSplitPluginOptions {
    define?: DefineArgs;
    entryPoints?: string[];
    isProd?: boolean;
    prerender?: boolean;
    routes?: string[];
    spa?: boolean;
    template?: (args: HtmlTemplateArgs) => string;
    verbose?: boolean;
}
