import { HtmlTemplateArgs } from 'esbuild-plugin-html-split';

import {
    appRootSlot,
    fragmentBootScript,
    stateScriptSlot
} from '../../src/app/boot-contract.js';

export const htmlTemplate = (args: HtmlTemplateArgs) => {
    const routeScopes: string[] = args.define.routeScopes ?? [];
    // Prod shells are route-scoped — each HTML references only its own route
    // chunk plus the shared resources. Dev keeps the superset shell: the
    // dev server serves a single SPA fallback file, so every route's chunks
    // must be reachable from it. Scoping applies to JS only: CSS arrives
    // pre-deduped from the html-split plugin (route CSS chunks are never
    // linked; their rules live in the entry stylesheet).
    const isScoped = Boolean(args.define.isProd);
    // The prerender bundle is build tooling — no shell may load it.
    const isPrerenderResource = (resource: string) =>
        resource.includes('/static/js/prerender');
    const includeResource = (resource: string) => {
        if (isPrerenderResource(resource)) {
            return false;
        }

        const owner = routeScopes.find((scope) =>
            resource.startsWith(`${scope}-`)
        );

        return !isScoped || !owner || owner === args.scope;
    };
    // Dynamic chunks are only script-tagged when they are route page chunks
    // (a preload of the shell's own page module); anything else reached by
    // `import()` — e.g. syntax-highlighting grammars sequenced by their
    // importer — must not be evaluated eagerly.
    const isRouteChunk = (resource: string) =>
        routeScopes.some((scope) => resource.startsWith(`${scope}-`));
    const css = args.common.css
        .concat(args.css)
        .filter((resource) => !isPrerenderResource(resource));
    const js = args.common.js
        .filter(includeResource)
        .concat(
            args.dynamic.js.filter(
                (resource) =>
                    isRouteChunk(resource) && includeResource(resource)
            )
        )
        .concat(args.js)
        .filter((resource) => !isPrerenderResource(resource));

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${args.define.getTitle ? args.define.getTitle(args.scope) : ''}</title>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    ${fragmentBootScript}
    <link rel="dns-prefetch" href="${args.define.apiUrl}/api/contentful/graphql" />
${css.map((path) => `    <link href="${path}" rel="stylesheet" />`).join('\n')}
${js
    .map((path) => `    <script defer src="${path}" type="module"></script>`)
    .join('\n')}
</head>
<body class="theme-dark"><!-- shell-owned: prerendered markup needs the theme before the boot runs -->
    <noscript>You need to enable JavaScript to run this app.</noscript>
    ${appRootSlot}
    ${stateScriptSlot}
</body>
</html>
`;
};
