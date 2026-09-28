import { expect } from '@esm-bundle/chai';

import { watchRoute } from '../../src';

// The route value a watcher receives before any route has matched (no route
// table registered) still exposes the location's query.

describe('route value searchParams, unmatched', () => {
    const originalHref = window.location.href;

    before(() => {
        window.history.replaceState(
            {},
            '',
            `${window.location.pathname}?tab=boot`
        );
    });

    after(() => {
        window.history.replaceState({}, '', originalHref);
    });

    it('reads the query off the initial route value', () => {
        let tab: string | null | undefined;
        let matchedRoute: string | undefined;
        const unwatchRoute = watchRoute(({ value: routeValue }) => {
            matchedRoute = routeValue.matchedRoute;
            tab = routeValue.searchParams.get('tab');
        });

        unwatchRoute();

        expect(matchedRoute, 'no route matched').to.equal(undefined);
        expect(tab).to.equal('boot');
    });
});
