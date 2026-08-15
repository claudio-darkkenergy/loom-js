import { HtmlTemplateArgs } from 'esbuild-plugin-html-split';

export const htmlTemplate = (args: HtmlTemplateArgs) => {
    const routeScopes: string[] = args.define.routeScopes ?? [];
    // Prod shells are route-scoped — each HTML references only its own route
    // chunk/CSS plus the shared resources. Dev keeps the superset shell: the
    // dev server serves a single SPA fallback file, so every route's chunks
    // must be reachable from it.
    const isScoped = Boolean(args.define.isProd);
    const includeResource = (resource: string) => {
        const owner = routeScopes.find((scope) =>
            resource.startsWith(`${scope}-`)
        );

        return !isScoped || !owner || owner === args.scope;
    };
    const css = args.common.css.filter(includeResource).concat(args.css);
    const js = args.common.js.filter(includeResource).concat(args.js);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${args.define.getTitle ? args.define.getTitle(args.scope) : ''}</title>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <link rel="dns-prefetch" href="${args.define.apiUrl}/api/contentful/graphql" />
${css.map((path) => `    <link href="${path}" rel="stylesheet" />`).join('\n')}
${js
    .map((path) => `    <script defer src="${path}" type="module"></script>`)
    .join('\n')}
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
</body>
</html>
`;
};
