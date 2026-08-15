// @deprecated - use Route instead.

import { activity } from './activity';
import { getWindow } from './lib/dom';
import type { ActivityEffectAction, OnRouteOptions } from './types';

// The activity for the History API — created lazily so importing this module
// (which the package index re-exports) never touches the DOM. Off-browser it
// initializes against the render scope's injected window.
let historyApiActivity: ReturnType<typeof activity<Location>> | undefined;

const getHistoryApiActivity = () => {
    if (!historyApiActivity) {
        const win = getWindow();

        historyApiActivity = activity<Location>(win.location, { force: true });

        // Hook into the History API onpopstate event when the browser history updates via back/forward controls.
        win.addEventListener('popstate', () =>
            historyApiActivity?.update(getWindow().location)
        );
    }

    return historyApiActivity;
};

/**
 * Accepts a handler which is called any time the route is updated
 * & before any route effects run.
 * @param handler A handler to be called whenever the route udpates.
 * @returns An unsubscriber method to perform handler cleanup.
 */
export const onRouteUpdate: ReturnType<typeof activity<Location>>['watch'] = (
    handler
) => getHistoryApiActivity().watch(handler);

/**
 * Hooks into the framework's routing system.
 * @param routeConfigCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const router = (routeConfigCallback: ActivityEffectAction<Location>) => {
    const { effect } = getHistoryApiActivity();
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
export const onRoute = (event: Event, options?: OnRouteOptions) => {
    const win = getWindow();
    const action = (options?.replace && 'replaceState') || 'pushState';
    const href =
        options?.href || (event?.currentTarget as HTMLAnchorElement).href;
    const locationSnapshot = Object.assign({}, win.location);

    event?.preventDefault();

    // Update the browser url.
    win.history[action]({}, 'onRoute', href);
    didRouteChange(locationSnapshot) &&
        getHistoryApiActivity().update(win.location);
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
