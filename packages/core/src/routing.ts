import { activity } from './activity';
import {
    ActivityHandler,
    OnRouteOptions,
    RouteUpdateHandler,
    SyntheticMouseEvent
} from './types';

// Setup the activity for the History API
const historyApiActivity = activity<Location>(
    window.location,
    ({ input, update }) => {
        // On-change handlers should be resolved first.
        callRouteOnChangeHandlers(input);
        // Finally, update the route effects.
        update(input, true);
    }
);
const { update } = historyApiActivity;
// Calls all registered on-change handlers when the route updates.
const callRouteOnChangeHandlers = (loc: Location) =>
    onRouteHandlers.forEach((handler) => handler(loc));
// Stores the route handlers.
const onRouteHandlers = new Set<any>();

// Hook into the History API onpopstate event when the browser history updates via back/forward controls.
window.addEventListener('popstate', () => update(window.location));

/**
 * Accepts a handler which is called any time the route is updated
 * & before any route effects run.
 * @param handler A handler to be called whenever the route udpates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const onRouteUpdate = (handler: RouteUpdateHandler) => {
    onRouteHandlers.add(handler);
    return () => onRouteHandlers.delete(handler);
};

/**
 * Hooks into the framework's routing system.
 * @param routeConfigCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const router = (routeConfigCallback: ActivityHandler<Location>) => {
    const { effect } = historyApiActivity;
    // Return the resolved route.
    return effect((props) =>
        // @TODO Possibly handle async here (async/await.)
        routeConfigCallback(props)
    );
};

/**
 * Use this to artificially update the browser `History` causing a navigation to occur.
 * @param event A `MouseEvent` object.
 * @param options Options should be passed when the event-target is not an `HTMLAnchorElement`.
 *      Options properties accepted:
 *          `href` - The href url to use - this overrides the href attribute of an `HTMLAnchorElement`.
 *          `onHash` - A callback which fires whenever `Window.Location` hash exists & the route otherwise hasn't changed.
 *          `replace` - If set to `true`, "replaceState" will be used instead of "pushState" as the `History` action.
 */
export const onRoute = <T>(
    event: SyntheticMouseEvent<T | HTMLAnchorElement>,
    options?: OnRouteOptions
) => {
    const action = (options?.replace && 'replaceState') || 'pushState';
    const href =
        options?.href || (event?.currentTarget as HTMLAnchorElement).href;
    const locationSnapshot = Object.assign({}, window.location);

    event?.preventDefault();

    // Update the browser url.
    window.history[action]({}, 'onRoute', href);

    if (didRouteChange(locationSnapshot)) {
        // Update the view.
        update(window.location);
    } else if (window.location.hash) {
        // Call `onHash` callback w/ current `Window.Location` state.
        options?.onHash && options.onHash(window.location);
    }
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

/**
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
