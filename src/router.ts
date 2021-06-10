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

export const router = (routeConfigCallback: ActivityHandler<Location>) => {
    const { effect } = historyApiActivity;
    // Return the resolved route.
    return effect((props) => routeConfigCallback(props));
};

export const onRoute = <T>(
    event?: SyntheticMouseEvent<T>,
    options?: OnRouteOptions
) => {
    const action = (options?.replace && 'replaceState') || 'pushState';
    const href =
        options?.href || ((event?.target as unknown) as HTMLAnchorElement).href;

    event?.preventDefault();

    if (href) {
        // Update the browser url.
        window.history[action]({}, 'onRoute', href);
        // Update the view.
        update(window.location, true);
    }
};
