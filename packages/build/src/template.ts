// The default shell template. Prod shells are route-scoped — each HTML
// references only its own route chunk plus the shared resources. Dev keeps
// the superset shell: the dev server serves a single SPA fallback file, so
// every route's chunks must be reachable from it.
import { appRootSlot, stateScriptSlot } from '@loom-js/core';
import {
    routeScopeOf,
    type HtmlTemplateArgs
} from '@loom-js/esbuild-plugin-html-split';

import type { HtmlOptions, Mode } from './config';

/** The output name of the prerender bundle — build tooling no shell may load. */
export const PRERENDER_ENTRY_NAME = 'static/js/prerender';

export interface TemplateContext {
    html: HtmlOptions;
    mode: Mode;
    routes: string[];
}

const isPrerenderResource = (resource: string) =>
    resource.includes(`/${PRERENDER_ENTRY_NAME}`);

/** Builds the template the plugin calls, closing over the resolved config. */
export const createTemplate =
    ({ html, mode, routes }: TemplateContext) =>
    (args: HtmlTemplateArgs) => {
        if (html.template) {
            return html.template(args);
        }

        const routeScopes = routes.map(routeScopeOf);
        const isScoped = mode === 'production';
        const includeResource = (resource: string) => {
            if (isPrerenderResource(resource)) {
                return false;
            }

            const owner = routeScopes.find((scope) =>
                resource.startsWith(`${scope}-`)
            );

            return !isScoped || !owner || owner === args.scope;
        };
        // Dynamic chunks are only script-tagged when they are route page
        // chunks (a preload of the shell's own page module); anything else
        // reached by `import()` must not be evaluated eagerly.
        const isRouteChunk = (resource: string) =>
            routeScopes.some((scope) => resource.startsWith(`${scope}-`));
        const css = args.common.css
            .concat(args.css)
            .concat(args.routeCss)
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
        const bodyClass = html.bodyClass ? ` class="${html.bodyClass}"` : '';
        const head = [
            `    <title>${html.title ? html.title(args.scope) : ''}</title>`,
            '    <meta charset="utf-8" />',
            '    <meta content="width=device-width, initial-scale=1.0" name="viewport" />',
            ...(html.head ? [html.head(args)] : []),
            ...css.map((path) => `    <link href="${path}" rel="stylesheet" />`),
            `    <script>window.__ROUTE_ASSETS__ = ${JSON.stringify(args.routeAssets)}</script>`,
            ...js.map(
                (path) =>
                    `    <script defer src="${path}" type="module"></script>`
            )
        ];

        return `
<!DOCTYPE html>
<html>
<head>
${head.join('\n')}
</head>
<body${bodyClass}>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    ${appRootSlot}
    ${stateScriptSlot}
</body>
</html>
`;
    };
