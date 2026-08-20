import { expect } from '@esm-bundle/chai';

import {
    component,
    createRoutes,
    route,
    watchLocation,
    watchRoute
} from '../../src';
import type { ContextFunction, RouteValue } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for the route guard (`core-api-follow-ups` design Decisions 2 & 3):
// `createRoutes`' `guard` runs on every valid match with the candidate
// `RouteValue`; a `false` verdict suppresses the route emission — route
// subscribers stay silent & page content keeps its current delivery — while
// the raw location layer still observes the navigation & the URL still moves.
//
// Test order matters: the specs share the page's router singleton & route
// table, so each spec builds on the navigation state the previous one left.

const HomePage = component(
    (html) => html`
        <div id="guard-home">home content</div>
    `
);
const OpenPage = component(
    (html) => html`
        <div id="guard-open">open content</div>
    `
);
const GatedPage = component(
    (html) => html`
        <div id="guard-gated">gated content</div>
    `
);

const waitFor = async (predicate: () => boolean, timeoutMs = 2000) => {
    const start = Date.now();

    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('Timed out waiting on a predicate.');
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('route guard', () => {
    const originalHref = window.location.href;
    const homePathname = window.location.pathname;
    const routesConfig = {
        [homePathname]: () => Promise.resolve({ default: HomePage }),
        '/guard-open': () => Promise.resolve({ default: OpenPage }),
        '/guard-gated/:section': () => Promise.resolve({ default: GatedPage })
    };
    // The guard's verdict & call log — each spec arranges these.
    let guardVerdict = true;
    const guardCalls: {
        matchedRoute?: string;
        params: RouteValue['params'];
        pathname?: string;
        // `raw` is the live `Location`, so snapshot the pathname at call time.
        rawPathname: string;
    }[] = [];

    before(async () => {
        const Routes = createRoutes({
            config: routesConfig,
            guard: (routeValue) => {
                guardCalls.push({
                    matchedRoute: routeValue.matchedRoute,
                    params: routeValue.params,
                    pathname: routeValue.pathname,
                    rawPathname: routeValue.raw.pathname
                });

                return guardVerdict;
            }
        });

        await runSetup({
            containerProps: {
                TestComponent: () => Routes({}) as ContextFunction
            }
        });
        await waitFor(() => document.getElementById('guard-home') !== null);
    });

    after(() => {
        window.history.replaceState({}, '', originalHref);
    });

    it('emits the match when the guard passes', async () => {
        let routeEmissions = 0;
        const unwatchRoute = watchRoute(() => routeEmissions++);

        // The watch fires immediately with the current route — start counting
        // from the navigation.
        routeEmissions = 0;
        guardVerdict = true;

        route(null, { href: '/guard-open' });
        await waitFor(() => document.getElementById('guard-open') !== null);
        unwatchRoute();

        expect(routeEmissions, 'route emission observed').to.equal(1);
        expect(
            guardCalls[guardCalls.length - 1]?.matchedRoute,
            'guard consulted for the match'
        ).to.equal('/guard-open');
    });

    it('suppresses the emission on a false verdict, content unchanged', async () => {
        let routeEmissions = 0;
        const unwatchRoute = watchRoute(() => routeEmissions++);

        routeEmissions = 0;
        guardVerdict = false;

        route(null, { href: '/guard-gated/alpha' });
        await settle();
        unwatchRoute();

        expect(routeEmissions, 'route subscribers stayed silent').to.equal(0);
        // Compare booleans, not elements — a failing element-valued assertion
        // sends chai's inspector into the framework-annotated DOM node & the
        // message serialization never returns.
        expect(
            document.getElementById('guard-gated') === null,
            'gated content never rendered'
        ).to.be.true;
        expect(
            document.getElementById('guard-open') !== null,
            'previous content stayed put'
        ).to.be.true;
        // Guarded-out navigations still move the URL (design Decision 3).
        expect(window.location.pathname).to.equal('/guard-gated/alpha');
    });

    it('hands the guard the candidate route value', () => {
        const suppressedCall = guardCalls[guardCalls.length - 1];

        expect(suppressedCall?.matchedRoute).to.equal('/guard-gated/:section');
        expect(suppressedCall?.params).to.deep.equal({ section: 'alpha' });
        expect(suppressedCall?.pathname).to.equal('/guard-gated/alpha');
        expect(suppressedCall?.rawPathname).to.equal('/guard-gated/alpha');
    });

    it('still fires the location layer on suppression', async () => {
        let locationEmissions = 0;
        const unwatchLocation = watchLocation(() => locationEmissions++);

        // The watch fires immediately with the current location — start
        // counting from the navigation.
        locationEmissions = 0;
        guardVerdict = false;

        route(null, { href: '/guard-gated/beta' });
        await settle();
        unwatchLocation();

        expect(
            locationEmissions,
            'location layer observed the navigation'
        ).to.equal(1);
        expect(
            document.getElementById('guard-gated') === null,
            'route layer stayed suppressed'
        ).to.be.true;
    });

    it('gates nothing once the guard is unregistered (last call wins)', async () => {
        const guardCallCount = guardCalls.length;

        // Replacing the route table without a guard clears it — verdicts no
        // longer apply, even though the captured one still says `false`.
        guardVerdict = false;
        createRoutes({ config: routesConfig });

        await waitFor(() => document.getElementById('guard-gated') !== null);

        expect(guardCalls.length, 'the stale guard never ran').to.equal(
            guardCallCount
        );
    });
});
