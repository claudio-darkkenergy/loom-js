import { activity } from './activity';
import { lazyImport } from './lazy-import';
import type {
    ActivityEffectAction,
    ContextFunction,
    OnRouteOptions,
    ReservedProps,
    RouteValue,
    SyntheticRouteEvent,
    ValueProp
} from './types';

export type RoutesConfig = Record<string, () => Promise<any>>;

class Router {
    private fallback: () => Promise<ContextFunction | undefined> = () =>
        Promise.resolve(undefined);
    private matchedRoute?: string;
    private params = {} as { [key: string]: string };
    private pathImporter?: () => Promise<any>;
    private pathname?: string;
    private routeActivity: ReturnType<typeof activity<RouteValue, Location>>;
    private routesConfig?: RoutesConfig;

    constructor() {
        this.routeActivity = activity<RouteValue, Location>(
            this.getRouteValue(window.location),
            {
                transform: ({ input: location, update }) =>
                    this.transform(location, update)
            }
        );
    }

    createRoutes({
        config = {},
        fallback = () => Promise.resolve(undefined)
    }: {
        config?: RoutesConfig;
        fallback?: () => Promise<ContextFunction | undefined>;
        guard?: (routeValue: RouteValue) => boolean;
    }) {
        this.routesConfig = config;
        this.fallback = fallback;
        this.routeActivity.update(window.location);

        // Hook into the History API onpopstate event when the browser history updates via back/forward controls.
        window.addEventListener('popstate', () =>
            this.routeActivity.update(window.location)
        );

        return (props: ReservedProps) => this.pageRouteEffect(props);
    }

    routeEffect(routeEffectCallback: ActivityEffectAction<RouteValue>) {
        const { effect } = this.routeActivity;
        // Return the resolved route.
        return effect(routeEffectCallback);
    }

    redirect(href: string) {
        this.route(null, { href, replace: true });
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

        const action = (options?.replace && 'replaceState') || 'pushState';
        const href =
            options?.href || (event?.currentTarget as HTMLAnchorElement).href;
        const locationSnapshot = Object.assign({}, window.location);

        event?.preventDefault();

        // Update the browser url.
        window.history[action]({}, 'route', href);
        didRouteChange(locationSnapshot) &&
            this.routeActivity.update(window.location);
    }

    watchRoute(action: (valueProp: ValueProp<RouteValue>) => any) {
        const { watch } = this.routeActivity;
        return watch(action);
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

    // Sets up the activity effect to load a page based on the current route.
    private pageRouteEffect(props: ReservedProps): ContextFunction | undefined {
        const { effect, update } = lazyImport<ContextFunction | undefined>(
            'page-route',
            this.fallback
        );
        let currentPath: string | undefined = undefined;

        this.watchRoute(({ value: routeValue }) => {
            // Skip update for same path.
            if (currentPath === this.matchedRoute) {
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

    // The activity transform logic - updates the route value & activity when a route is matched
    // to the current location.
    private transform(
        location: Location,
        update: (valueInput: RouteValue) => void
    ) {
        if (!this.routesConfig) {
            return;
        }

        const { pathname } = sanitizeLocation(location);
        const { matchedRoute, pathImporter, segmentValues } = matchRoute(
            this.routesConfig,
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
            const defaultImporter = this.routesConfig?.['/'];

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

/**
 * Returns `true` if `Window.Location` has changed in consideration to `origin`, `pathname`, & `search`.
 * @param locationSnapshot A snapshot of `Window.Location` before any browser history updates were made.
 * @returns `true` if only the `Window.Location` has changed.
 */
const didRouteChange = ({ origin, pathname, search }: Location) =>
    origin !== window.location.origin ||
    pathname !== window.location.pathname ||
    search !== window.location.search;

const router = new Router();

/**
 * Initializes the router with the provided routes.
 * Lazy-loads the component from the importer based on the current route/`Location`.
 * @param options
 *      `config` - A mapping of route paths to importers of the content to be rendered.
 *      `fallback` - A fallback function to be called when no route matches.
 * @returns A component `ContextFunction`.
 */
export const createRoutes = (arg: Parameters<typeof router.createRoutes>[0]) =>
    router.createRoutes(arg);

/**
 * Hooks into the framework's routing system.
 * @param routeEffectCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const routeEffect = (arg: Parameters<typeof router.routeEffect>[0]) =>
    router.routeEffect(arg);
export const redirect = (arg: Parameters<typeof router.redirect>[0]) =>
    router.redirect(arg);

/**
 * Use this to artificially update the browser `History` causing a navigation to occur.
 * @param event A `MouseEvent` object.
 * @param options Options should be passed when the event-target is not an `HTMLAnchorElement`.
 *      Options properties accepted:
 *          `href` - The href url to use - this overrides the href attribute of an `HTMLAnchorElement`.
 *          `replace` - If set to `true`, "replaceState" will be used instead of "pushState" as the `History` action.
 */
export const route = (...arg: Parameters<typeof router.route>) =>
    router.route(...arg);

/**
 * Accepts a handler which is called any time the route is updated
 * & before any route effects run.
 * @param handler A handler to be called whenever the route udpates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const watchRoute = (arg: Parameters<typeof router.watchRoute>[0]) =>
    router.watchRoute(arg);

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
