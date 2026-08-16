import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { route, watchLocation, watchRoute } from '../../src';
import type { SyntheticRouteEvent } from '../../src';

// Specs for hash/anchor navigation (`docs-readiness` design D1/D2/D4):
// same-page hash navigations scroll their anchor target into view without
// waking the location/route activities, while the activation policy and the
// missing-target/empty-fragment contracts hold.

describe('hash navigation (same-page)', () => {
    const originalHref = window.location.href;
    let $anchorTarget: HTMLDivElement;
    let scrollIntoViewFake: sinon.SinonSpy;
    let scrollToFake: sinon.SinonSpy;

    const samePageHref = (fragment: string) =>
        `${window.location.pathname}${window.location.search}#${fragment}`;

    beforeEach(() => {
        $anchorTarget = document.createElement('div');
        $anchorTarget.id = 'hash-target';
        document.body.appendChild($anchorTarget);

        scrollIntoViewFake = sinon.replace(
            Element.prototype,
            'scrollIntoView',
            sinon.fake()
        );
        scrollToFake = sinon.replace(window, 'scrollTo', sinon.fake());
    });

    afterEach(() => {
        sinon.restore();
        $anchorTarget.remove();
        window.history.replaceState({}, '', originalHref);
    });

    it('should scroll the anchor target into view & update the URL', () => {
        route(null, { href: samePageHref('hash-target') });

        expect(window.location.hash).to.equal('#hash-target');
        expect(scrollIntoViewFake.calledOnce, 'scrolled once').to.be.true;
        expect(
            scrollIntoViewFake.calledOn($anchorTarget),
            'scrolled the fragment target'
        ).to.be.true;
    });

    it('should decode an encoded fragment before matching an id', () => {
        $anchorTarget.id = 'my heading';

        route(null, { href: samePageHref('my%20heading') });

        expect(scrollIntoViewFake.calledOn($anchorTarget)).to.be.true;
    });

    it('should emit nothing on the location & route activities', () => {
        const locationHandler = sinon.fake();
        const routeHandler = sinon.fake();
        const unsubscribeLocation = watchLocation(locationHandler);
        const unsubscribeRoute = watchRoute(routeHandler);
        const locationCallCount = locationHandler.callCount;
        const routeCallCount = routeHandler.callCount;

        route(null, { href: samePageHref('hash-target') });

        expect(locationHandler.callCount, 'location stayed quiet').to.equal(
            locationCallCount
        );
        expect(routeHandler.callCount, 'route stayed quiet').to.equal(
            routeCallCount
        );

        unsubscribeLocation();
        unsubscribeRoute();
    });

    it('should no-op when the fragment matches no element', () => {
        route(null, { href: samePageHref('missing-anchor') });

        expect(window.location.hash).to.equal('#missing-anchor');
        expect(scrollIntoViewFake.called, 'no scroll attempted').to.be.false;
    });

    it('should scroll to the top for an empty fragment', () => {
        route(null, { href: samePageHref('') });

        expect(scrollToFake.calledWith(0, 0), 'scrolled to the top').to.be.true;
        expect(scrollIntoViewFake.called).to.be.false;
    });

    it('should leave modified activations with hash hrefs to the browser', () => {
        const anchor = document.createElement('a');

        anchor.href = samePageHref('hash-target');

        const activation = {
            altKey: false,
            ctrlKey: false,
            currentTarget: anchor,
            defaultPrevented: false,
            metaKey: true,
            preventDefault: sinon.fake(),
            shiftKey: false,
            target: anchor
        } as unknown as SyntheticRouteEvent<HTMLAnchorElement> & {
            preventDefault: sinon.SinonSpy;
        };

        route(activation);

        expect(activation.preventDefault.called, 'default left alone').to.be
            .false;
        expect(scrollIntoViewFake.called, 'no scroll claimed').to.be.false;
    });
});
