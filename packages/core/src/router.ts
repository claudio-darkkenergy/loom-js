import { activity } from './activity';
import { DomWindow, getWindow, hasWindow } from './lib/dom';
import type {
    ActivityEffectAction,
    ContextFunction,
    OnRouteOptions,
    ReservedProps,
    RouteValue,
    SyntheticRouteEvent,
    Unsubscriber,
    ValueProp
} from './types';

export type RoutesConfig = Record<string, () => Promise<any>>;

const defaultFallback = () => Promise.resolve(undefined);

// The app-global route table. `createRoutes` captures into it without touching
// the DOM, so module-scope registration is legal in any runtime; every
// per-window router reads it at transform time, so a router constructed after
// the capture (the server case) matches immediately. A repeat `createRoutes`
// call replaces the table — last call wins.
const routeTable: {
    fallback: () => Promise<ContextFunction | undefined>;
    routesConfig?: RoutesConfig;
} = { fallback: defaultFallback };

class Router {
    private locationActivity: ReturnType<typeof activity<Location>>;
    private matchedRoute?: string;
    private ownerWindow: DomWindow;
    private pageImportActivity?: ReturnType<
        typeof activity<
            ContextFunction | undefined,
            () => Promise<ContextFunction | undefined>
        >
    >;
    private params = {} as { [key: string]: string };
    private pathImporter?: () => Promise<any>;
    private pathname?: string;
    // The URL fragment owed a scroll once routed content renders — set by
    // fragment-carrying route-changing navigations & the initial location,
    // consumed (or overwritten by the next navigation) exactly once.
    private pendingFragment?: string;
    private routeActivity: ReturnType<typeof activity<RouteValue, Location>>;

    // Construction is DOM-lazy by design: instances only come from
    // `getRouter()`, which resolves the provider window — so the initial
    // location read and the history listener happen on first routing use
    // inside a DOM scope, never at module load.
    constructor(win: DomWindow) {
        this.ownerWindow = win;
        // Initial-load anchor: the browser's native scroll fired before
        // lazily-imported route content existed, so the fragment is still
        // owed once that content renders.
        this.pendingFragment = win.location.hash
            ? win.location.hash.slice(1)
            : undefined;
        this.locationActivity = activity<Location>(win.location, {
            // The raw location layer keeps the legacy activity's semantics:
            // it fires on every update, even a same-location one.
            force: true
        });
        this.routeActivity = activity<RouteValue, Location>(
            this.getRouteValue(win.location),
            {
                transform: ({ input: location, update }) =>
                    this.transform(location, update)
            }
        );

        // The pipeline: raw location → match transform → route value. The
        // watch fires immediately, so a router constructed after the route
        // table was captured (module-scope `createRoutes`, server renders)
        // matches its current location right away.
        this.locationActivity.watch(({ value: location }) =>
            this.routeActivity.update(location)
        );

        // Hook into the History API onpopstate event when the browser history
        // updates via back/forward controls — one listener per instance.
        win.addEventListener('popstate', () =>
            this.locationActivity.update(win.location)
        );
    }

    locationEffect(locationEffectCallback: ActivityEffectAction<Location>) {
        const { effect } = this.locationActivity;

        return effect(locationEffectCallback);
    }

    // Sets up the activity effect to load a page based on the current route.
    pageRouteEffect(props: ReservedProps): ContextFunction | undefined {
        const { effect, update } = this.getPageImportActivity();
        let currentPath: string | undefined = undefined;

        this.watchRoute(({ value: routeValue }) => {
            // Skip update for same path.
            if (currentPath === this.matchedRoute) {
                // The page content is already delivered (a param-only
                // navigation within the same matched route), so a pending
                // fragment consumes now rather than on a page import.
                this.consumePendingFragment();
                return;
            }

            // Update the current path.
            currentPath = this.matchedRoute;

            const importer = async () => {
                const { default: ComponentFn } = await (
                    this.pathImporter as () => Promise<any>
                )();

                return ComponentFn({
                    ...props,
                    routeProps: routeValue
                });
            };

            update(importer);
        });

        return effect(
            ({ value: contextFn }) => contextFn as ContextFunction | undefined
        );
    }

    redirect(href: string) {
        this.route(null, { href, replace: true });
    }

    // Re-runs the match transform against the current location — used when
    // the route table is replaced after this router was constructed.
    refreshRoute() {
        this.routeActivity.update(getWindow().location);
    }

    route<T extends EventTarget = HTMLAnchorElement>(
        event: SyntheticRouteEvent<T> | null,
        options?: OnRouteOptions
    ) {
        if (
            event?.ctrlKey ||
            event?.metaKey ||
            event?.shiftKey ||
            event?.altKey ||
            event?.defaultPrevented
        ) {
            // Maintains native behavior for modified activations — new tab
            // (ctrl/cmd), new window (shift), download (alt) — and leaves
            // events another handler already consumed.
            return;
        }

        const win = getWindow();
        const action = (options?.replace && 'replaceState') || 'pushState';
        const href =
            options?.href || (event?.currentTarget as HTMLAnchorElement).href;
        const locationSnapshot = Object.assign({}, win.location);
        // The href's fragment: `''` for a bare trailing `#` (scroll-to-top),
        // `undefined` when the href carries no fragment at all. Read from the
        // href rather than `location.hash`, which can't represent a bare `#`.
        const hashIndex = href.indexOf('#');
        const fragment = hashIndex > -1 ? href.slice(hashIndex + 1) : undefined;

        event?.preventDefault();

        // Update the browser url. The location activity heads the pipeline,
        // so both location and route subscribers observe the navigation.
        win.history[action]({}, 'route', href);

        if (didRouteChange(locationSnapshot)) {
            // Defer any fragment until the routed content renders — and drop
            // a stale unconsumed one when this navigation carries none.
            this.pendingFragment = fragment;
            this.locationActivity.update(win.location);
        } else if (fragment !== undefined) {
            // Hash-only navigation: the activity pipeline stays quiet — the
            // router owes only the native anchor jump its `preventDefault`
            // suppressed.
            scrollToFragment(win, fragment);
        }
    }

    routeEffect(routeEffectCallback: ActivityEffectAction<RouteValue>) {
        const { effect } = this.routeActivity;
        // Return the resolved route.
        return effect(routeEffectCallback);
    }

    watchLocation(
        action: (valueProp: ValueProp<Location>) => any
    ): Unsubscriber {
        const { watch } = this.locationActivity;

        return watch(action);
    }

    watchRoute(action: (valueProp: ValueProp<RouteValue>) => any) {
        const { watch } = this.routeActivity;
        return watch(action);
    }

    // The lazy page-content activity — one per router, i.e. per window, so
    // server renders can't leak page content across each other. Mirrors
    // `lazyImport` minus its module-global cache: created on first use,
    // seeded with the captured fallback importer.
    private getPageImportActivity() {
        if (!this.pageImportActivity) {
            this.pageImportActivity = activity<
                ContextFunction | undefined,
                () => Promise<ContextFunction | undefined>
            >(undefined, async ({ input: importer, update }) => {
                const contextFn = await importer();

                // Guard post-scope settles: on a server, this router's render
                // scope may have closed (a synchronous render of a route-table
                // app serializes the shell — documented) or moved on to
                // another window before the importer landed. Rendering the
                // settled page requires this router's own window to be the
                // resolvable one; otherwise drop the update. In a browser the
                // resolved window never changes, so this always passes.
                if (hasWindow() && getWindow() === this.ownerWindow) {
                    update(contextFn);
                    // Routed content delivered — a pending anchor fragment
                    // (cross-page navigation, initial load) consumes against
                    // it. The seeded default fallback resolves no content, so
                    // it can't consume a fragment the real page still owes.
                    contextFn && this.consumePendingFragment();
                }
            });
            this.pageImportActivity.update(routeTable.fallback);
        }

        return this.pageImportActivity;
    }

    // Scrolls to the pending fragment's anchor target, once — cleared before
    // the attempt, single attempt, silent no-op when the target is absent.
    // A microtask puts the attempt after the routed content's synchronous
    // mount settles; scrolling needs no paint, & unlike an animation frame a
    // microtask is neither throttled in background pages nor absent in
    // provider DOMs.
    private consumePendingFragment() {
        const fragment = this.pendingFragment;

        if (fragment === undefined) {
            return;
        }

        this.pendingFragment = undefined;

        const win = this.ownerWindow;

        queueMicrotask(() => scrollToFragment(win, fragment));
    }

    // Returns the route value for the current location.
    private getRouteValue(location: Location) {
        return {
            raw: location,
            matchedRoute: this.matchedRoute,
            params: this.params,
            pathname: this.pathname
        };
    }

    // The activity transform logic - updates the route value & activity when a route is matched
    // to the current location.
    private transform(
        location: Location,
        update: (valueInput: RouteValue) => void
    ) {
        const { routesConfig } = routeTable;

        if (!routesConfig) {
            return;
        }

        const { pathname } = sanitizeLocation(location);
        const { matchedRoute, pathImporter, segmentValues } = matchRoute(
            routesConfig,
            pathname
        );

        // Skip the activity update if a route was invalid or not matched to the configured routes.
        if (!matchedRoute || !this.validateRoute(pathname, pathImporter)) {
            return;
        }

        // A route was matched & is valid - update the route value properties & then the activity.
        this.matchedRoute = matchedRoute;
        this.pathImporter = pathImporter;
        this.pathname = pathname;
        // @TODO this.parseQuery();
        this.params = extractParams(matchedRoute, segmentValues);

        update(this.getRouteValue(location));
    }

    // Verifies that an importer for the exists & handles the result appropriately.
    // Warns or throws when the route is considered invalid, returning the validation result when possible.
    private validateRoute(pathname: string, pathImporter?: () => Promise<any>) {
        // Handle missing importer.
        if (!pathImporter) {
            const defaultImporter = routeTable.routesConfig?.['/'];

            if (defaultImporter) {
                console.warn(
                    `No path found for ${pathname}. Falling back to '/'.`
                );

                this.redirect('/');
                return false;
            }

            throw new Error(`No path found for ${pathname}`);
        }

        return true;
    }
}

// Matches to the path segment while omitting slashes, i.e "/segment-1/" = "segment-1".
const pathSegmentRx = '(?:\\/(\\w+[\\w|-]*))';

// Matches the pathname against the configured route paths — each dynamic
// param segment is replaced with the path segment regex.
const matchRoute = (routesConfig: RoutesConfig, pathname: string) => {
    let segmentValues: string[] = [];
    const [matchedRoute, pathImporter] =
        Object.entries(routesConfig).find(([routePath]) => {
            const routePathRx = routePath.replace(
                // paramRx
                /\/:\w+\/?/,
                `${pathSegmentRx}?`
            );
            const matchValue = pathname.match(new RegExp(`^${routePathRx}$`));

            if (matchValue) {
                segmentValues = matchValue.slice(1);
                return true;
            }

            return false;
        }) || [];

    return { matchedRoute, pathImporter, segmentValues };
};

// Parses the dynamic parameter values out of the matched route path.
const extractParams = (routePath: string, segmentValues: string[]) => {
    const params: { [key: string]: string } = {};
    const matchKey = routePath.match(/\/:(\w+)\/?/);

    if (matchKey) {
        matchKey.slice(1).forEach((param, paramIndex) => {
            params[param] = segmentValues[paramIndex] || '';
        });
    }

    return params;
};

// Scrolls to the anchor target named by a URL fragment — the native anchor
// jump that `route()`'s `preventDefault` suppresses. A missing target is a
// silent no-op, and the runtime guards keep provider DOMs without CSSOM view
// APIs (server renders) inert.
const scrollToFragment = (win: DomWindow, fragment: string) => {
    if (!fragment) {
        // A bare `#` — native behavior scrolls to the top.
        typeof win.scrollTo === 'function' && win.scrollTo(0, 0);
        return;
    }

    const target = win.document.getElementById(decodeURIComponent(fragment));

    typeof target?.scrollIntoView === 'function' && target.scrollIntoView();
};

/**
 * Returns `true` if `Window.Location` has changed in consideration to `origin`, `pathname`, & `search`.
 * @param locationSnapshot A snapshot of `Window.Location` before any browser history updates were made.
 * @returns `true` if only the `Window.Location` has changed.
 */
const didRouteChange = ({ origin, pathname, search }: Location) =>
    origin !== getWindow().location.origin ||
    pathname !== getWindow().location.pathname ||
    search !== getWindow().location.search;

// One router per provider window: in a browser there is one window forever, so
// one router — the singleton emerges rather than being enforced. On a server
// each injected window resolves its own instance — per-render isolation —
// garbage-collected together with its window.
const routerRegistry = new WeakMap<DomWindow, Router>();

const getRouter = () => {
    const win = getWindow();
    let routerInstance = routerRegistry.get(win);

    if (!routerInstance) {
        routerInstance = new Router(win);
        routerRegistry.set(win, routerInstance);
    }

    return routerInstance;
};

/**
 * Registers the app's routes & returns the routes component to compose into
 * the layout tree. The component lazy-loads each page from its importer based
 * on the current route/`Location`.
 *
 * Registration is DOM-free: calling this at module scope is safe in any
 * runtime (including off-browser); the history wiring defers to the first
 * routing use inside a DOM scope. Calling it again replaces the route table —
 * last call wins.
 * @param options
 *      `config` - A mapping of route paths to importers of the content to be rendered.
 *      `fallback` - A fallback function to be called when no route matches.
 * @returns A component `ContextFunction`.
 */
export const createRoutes = ({
    config = {},
    fallback = defaultFallback
}: {
    config?: RoutesConfig;
    fallback?: () => Promise<ContextFunction | undefined>;
    guard?: (routeValue: RouteValue) => boolean;
}) => {
    routeTable.fallback = fallback;
    routeTable.routesConfig = config;

    // A router already constructed for the current window observes the
    // replaced table immediately; a not-yet-constructed router matches at
    // construction time.
    if (hasWindow()) {
        routerRegistry.get(getWindow())?.refreshRoute();
    }

    return (props: ReservedProps) => getRouter().pageRouteEffect(props);
};

/**
 * Hooks an effect to raw `Location` changes — layer 1 of the routing
 * pipeline. Zero-config: no route table is required, and the effect re-runs
 * on every navigation.
 * @param locationEffectCallback An `ActivityEffectAction<Location>`.
 * @returns A `ContextFunction` rendering the callback's result.
 */
export const locationEffect = (arg: Parameters<Router['locationEffect']>[0]) =>
    getRouter().locationEffect(arg);

/**
 * Hooks into the framework's routing system.
 * @param routeEffectCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const routeEffect = (arg: Parameters<Router['routeEffect']>[0]) =>
    getRouter().routeEffect(arg);
export const redirect = (arg: Parameters<Router['redirect']>[0]) =>
    getRouter().redirect(arg);

/**
 * Use this to artificially update the browser `History` causing a navigation to occur.
 * @param event A `MouseEvent` object.
 * @param options Options should be passed when the event-target is not an `HTMLAnchorElement`.
 *      Options properties accepted:
 *          `href` - The href url to use - this overrides the href attribute of an `HTMLAnchorElement`.
 *          `replace` - If set to `true`, "replaceState" will be used instead of "pushState" as the `History` action.
 */
export const route = (...arg: Parameters<Router['route']>) =>
    getRouter().route(...arg);

/**
 * Accepts a handler which is called any time the raw `Location` updates —
 * layer 1 of the routing pipeline, requiring no route table.
 * @param handler A handler to be called whenever the location updates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const watchLocation = (arg: Parameters<Router['watchLocation']>[0]) =>
    getRouter().watchLocation(arg);

/**
 * Accepts a handler which is called any time the route is updated
 * & before any route effects run.
 * @param handler A handler to be called whenever the route udpates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const watchRoute = (arg: Parameters<Router['watchRoute']>[0]) =>
    getRouter().watchRoute(arg);

/**
 * `export` DEPRECATED Automatically used within the router - will be removed as an export in the future.
 * Sanitizes the `Window.Location` object as follows:
 *      `pathname` returns "/" or `/${path}` where the trailing slash is trimmed.
 * @param location The current state of `Window.Location`.
 * @returns A sanitized `Location` object shallow copy.
 */
export const sanitizeLocation = ({ pathname, ...loc }: Location) => ({
    ...loc,
    pathname:
        pathname.length > 1 && pathname[pathname.length - 1] === '/'
            ? pathname.slice(0, pathname.length - 1)
            : pathname
});
