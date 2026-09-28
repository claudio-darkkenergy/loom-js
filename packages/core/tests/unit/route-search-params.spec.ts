import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
    component,
    createRoutes,
    route,
    routeEffect,
    watchRoute
} from '../../src';
import type { ContextFunction, RouteValue } from '../../src/types';
import { runSetup } from '../support/run-setup';

// Specs for the route value's `searchParams` getter: readable everywhere the
// route value flows (effect, watcher, guard, page), constructed only on
// access, & a fresh instance per access.
//
// Test order matters: the specs share the page's router singleton & route
// table, so each spec builds on the navigation state the previous one left.

const HomePage = component(
    (html) => html`
        <div id="search-home">home content</div>
    `
);
const QueryPage = component(
    (html, { routeProps }) => html`
        <div id="search-page">${routeProps?.searchParams.get('tab') ?? ''}</div>
    `
);
const TabReadout = component(
    (html) => html`
        <div id="search-effect">
            ${routeEffect(({ value: routeValue }) =>
                TabText({ tab: routeValue.searchParams.get('tab') ?? '' })
            )}
        </div>
    `
);
const TabText = component<{ tab: string }>(
    (html, { tab }) => html`
        <span id="search-effect-tab">${tab}</span>
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

const textOf = (elementId: string) =>
    document.getElementById(elementId)?.textContent?.trim();

describe('route value searchParams', () => {
    const originalHref = window.location.href;
    const homePathname = window.location.pathname;
    // The query each guard call read off its candidate route value.
    const guardTabs: (string | null)[] = [];
    // Flipped off by the laziness spec so the guard stops reading.
    let guardReads = true;
    let latestRouteValue: RouteValue | undefined;
    let unwatchRoute: () => void;

    before(async () => {
        const Routes = createRoutes({
            config: {
                [homePathname]: () => Promise.resolve({ default: HomePage }),
                '/search-page': () => Promise.resolve({ default: QueryPage })
            },
            guard: (routeValue) => {
                guardReads &&
                    guardTabs.push(routeValue.searchParams.get('tab'));

                return true;
            }
        });
        const App = component(
            (html) => html`
                <div>${TabReadout()} ${Routes({}) as ContextFunction}</div>
            `
        );

        await runSetup({ containerProps: { TestComponent: () => App() } });
        await waitFor(() => document.getElementById('search-home') !== null);
        unwatchRoute = watchRoute(
            ({ value: routeValue }) => (latestRouteValue = routeValue)
        );
    });

    after(() => {
        unwatchRoute();
        window.history.replaceState({}, '', originalHref);
    });

    it('reflects the query at the guard, watcher, effect & page sites', async () => {
        route(null, { href: '/search-page?tab=docs&sort=asc' });
        await waitFor(() => document.getElementById('search-page') !== null);

        expect(guardTabs[guardTabs.length - 1], 'guard site').to.equal('docs');
        expect(
            latestRouteValue?.searchParams.get('sort'),
            'watcher site'
        ).to.equal('asc');
        expect(textOf('search-effect-tab'), 'effect site').to.equal('docs');
        expect(textOf('search-page'), 'page site').to.equal('docs');
    });

    it('follows a search-only navigation', async () => {
        route(null, { href: '/search-page?tab=api' });
        await waitFor(() => textOf('search-effect-tab') === 'api');

        expect(latestRouteValue?.searchParams.get('tab')).to.equal('api');
        expect(latestRouteValue?.searchParams.has('sort')).to.be.false;
    });

    it('returns a fresh instance per access, isolating mutation', () => {
        const mutated = latestRouteValue?.searchParams;

        mutated?.set('tab', 'tampered');
        mutated?.append('extra', '1');

        const untouched = latestRouteValue?.searchParams;

        expect(mutated === untouched, 'distinct instances').to.be.false;
        expect(untouched?.get('tab')).to.equal('api');
        expect(untouched?.has('extra')).to.be.false;
        // The detached copy never writes back to the URL.
        expect(window.location.search).to.equal('?tab=api');
    });

    it('constructs nothing when no consumer reads it', async () => {
        const constructorSpy = sinon.spy(window, 'URLSearchParams');
        let emissions = 0;
        const unwatchEmissions = watchRoute(() => emissions++);

        // The watch fires immediately — count from the navigation. Home has
        // no query reader once the guard stops reading: the effect readout
        // is the only reader left, so it is asserted as the single access.
        emissions = 0;
        guardReads = false;

        try {
            route(null, { href: `${homePathname}?tab=unread` });
            await waitFor(() => emissions === 1);
            await waitFor(() => textOf('search-effect-tab') === 'unread');

            expect(
                constructorSpy.callCount,
                'only the effect readout constructed one'
            ).to.equal(1);
            expect(constructorSpy.calledWithNew()).to.be.true;
        } finally {
            unwatchEmissions();
            constructorSpy.restore();
        }
    });
});
