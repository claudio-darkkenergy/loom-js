import { activity } from './activity';
import { ActivityHandler, SyntheticMouseEvent } from './types';

export interface OnRouteOptions {
    href?: string;
    replace?: boolean;
}

// Setup the activity for the History API
const historyApiActivity = activity<Location>(window.location);
const { update } = historyApiActivity;

// Hook into the History API onpopstate event when the browser history updates via back/forward controls.
window.addEventListener('popstate', () => update(window.location, true));

/**
 * Hooks into the framework's routing system.
 * @param routeConfigCallback An `ActivityHandler`.
 * @returns A new `Node`.
 */
export const router = (routeConfigCallback: ActivityHandler<Location>) => {
    const { effect } = historyApiActivity;
    // Return the resolved route.
    return effect((props) => routeConfigCallback(props));
};

/**
 * Use this to artificially update the browser `History` causing a navigation to occur.
 * @param event A `MouseEvent` object.
 * @param options Options should be passed when the event-target is not an `HTMLAnchorElement`.
 *      Options properties accepted:
 *          `href` - The href url to use - this overrides the href attribute of an `HTMLAnchorElement`.
 *          `replace` - If set to `true`, "replaceState" will be used instead of "pushState" as the `History` action.
 */
export const onRoute = <T>(
    event: SyntheticMouseEvent<T | HTMLAnchorElement>,
    options?: OnRouteOptions
) => {
    const action = (options?.replace && 'replaceState') || 'pushState';
    const href =
        options?.href || (event?.currentTarget as HTMLAnchorElement).href;

    event?.preventDefault();

    if (href) {
        // Update the browser url.
        window.history[action]({}, 'onRoute', href);
        // Update the view.
        update(window.location, true);
    }
};

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
