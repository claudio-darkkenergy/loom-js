import { activity } from './activity';
import { sanitizeLocation } from './router';
import type {
    ActivityEffectAction,
    OnRouteOptions,
    SyntheticMouseEvent
} from './types';

export type RouterRoute = {
    pathname: string;
};

export const getRouterRoute = (location: Location) => {
    const { pathname } = sanitizeLocation(location);
    return { pathname };
};

// @DEPRECATED Location as a union type will be removed in future versions.
// Maintaining for backwards compatibility.
export type RouterActivityValue = Location & {
    raw: Location;
    route: RouterRoute;
};

// Setup the activity for the History API
const getRouterValue = (location: Location) => ({
    ...location,
    raw: location,
    route: getRouterRoute(location)
});
const historyApiActivity = activity<RouterActivityValue>(
    getRouterValue(window.location)
);
const { update, watch } = historyApiActivity;

// Hook into the History API onpopstate event when the browser history updates via back/forward controls.
window.addEventListener('popstate', () =>
    update(getRouterValue(window.location))
);

/**
 * Accepts a handler which is called any time the route is updated
 * & before any route effects run.
 * @param handler A handler to be called whenever the route udpates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const onRouteUpdate = watch;

/**
 * Hooks into the framework's routing system.
 * @param routeConfigCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const router = (
    routeConfigCallback: ActivityEffectAction<RouterActivityValue>
) => {
    const { effect } = historyApiActivity;
    // Return the resolved route.
    return effect(routeConfigCallback);
};

/**
 * Use this to artificially update the browser `History` causing a navigation to occur.
 * @param event A `MouseEvent` object.
 * @param options Options should be passed when the event-target is not an `HTMLAnchorElement`.
 *      Options properties accepted:
 *          `href` - The href url to use - this overrides the href attribute of an `HTMLAnchorElement`.
 *          `replace` - If set to `true`, "replaceState" will be used instead of "pushState" as the `History` action.
 */
export const onRoute = <T = HTMLAnchorElement>(
    event: SyntheticMouseEvent<T>,
    options?: OnRouteOptions
) => {
    const action = (options?.replace && 'replaceState') || 'pushState';
    const href =
        options?.href || (event?.currentTarget as HTMLAnchorElement).href;
    const locationSnapshot = Object.assign({}, window.location);

    event?.preventDefault();

    // Update the browser url.
    window.history[action]({}, 'onRoute', href);
    didRouteChange(locationSnapshot) && update(getRouterValue(window.location));
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
