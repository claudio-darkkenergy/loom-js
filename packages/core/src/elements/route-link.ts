import { component } from '../component';
import { getWindow } from '../lib/dom';
import { route } from '../router';
import type { SyntheticRouteEvent } from '../types';

export type RouteLinkProps = {
    href?: string;
    target?: '_blank' | '_self';
};

// SPA-eligible activations delegate to the core router; new-tab targets and
// cross-origin hrefs fall through to the browser default (`pushState` throws
// on cross-origin URLs, so the gate is required, not just polite).
const routeOnClick = (event: Event) => {
    const anchor = event.currentTarget as HTMLAnchorElement;

    if (
        anchor.origin === getWindow().location.origin &&
        anchor.target !== '_blank'
    ) {
        route(event as SyntheticRouteEvent<HTMLAnchorElement>);
    }
};

export const RouteLink = /* @__PURE__ */ component<RouteLinkProps>(
    (html, { attrs, children, className, href, on, target }) => html`
        <a
            $attrs=${attrs}
            $click=${routeOnClick}
            $on=${on}
            class=${className}
            href=${href}
            target=${target}
        >
            ${children}
        </a>
    `
);
