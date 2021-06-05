import { activity } from './activity';
import { ActivityHandler, MouseEventListener } from './types';

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

export const routerLink: MouseEventListener = (event) => {
    const { href } = (event.target as unknown) as HTMLAnchorElement;
    const action = 'pushState';
    console.log('href', href);

    event.preventDefault();

    if (href) {
        // Update the browser url.
        window.history[action]({}, 'routerLink', href);
        // Update the view.
        update(window.location, true);
    }
};
