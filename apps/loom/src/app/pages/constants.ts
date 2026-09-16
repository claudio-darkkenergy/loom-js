// Route-config keys — `RouteValue.matchedRoute` carries these exact strings,
// so route-scoped watchers can guard against them.
export enum RoutePath {
    Docs = '/docs/:topic',
    Home = '/'
}

export enum ScreenWidthPx {
    TabletStart = 768,
    DesktopStart = 1199
}

/**
 * The slug of the single Contentful page backing the docs section — shared
 * by the runtime fetch hook and the prerender pass.
 */
export const DOCS_PAGE_SLUG = '/docs';
