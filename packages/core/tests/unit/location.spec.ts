import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { route, watchLocation, watchRoute } from '../../src';
import { Router, RouterPropValue } from '../support/components/router';
import { runSetup } from '../support/run-setup';

// Layer-1 specs: zero-config reactivity to raw `Location` via `locationEffect`
// (exercised through the support Router component) and `watchLocation` — no
// `createRoutes` call anywhere in this file, which is the point.

describe('location (layer-1 routing)', () => {
    let $test: HTMLElement;
    let $unit: HTMLElement | null;
    let $anchorDefault: HTMLAnchorElement | null | undefined;
    let $anchorTest: HTMLAnchorElement | null | undefined;
    let $anchorReplaceTest: HTMLAnchorElement | null | undefined;
    let $routerContainer: HTMLDivElement | null | undefined;
    const componentClassName = 'location-test';
    const testHash = '#test-hash';
    const defaultRoute = `/`;
    const replaceRoute = `/replace-location`;
    const testRoute = `/test-location`;
    const testValue: RouterPropValue = {
        defaultRoute,
        defaultText: 'Showing the default route',
        pushRouteClassname: 'test-route',
        replaceRoute: `${replaceRoute}/#replace-hash`,
        replaceRouteClassname: 'replace-route',
        replaceText: 'Showing the replace route',
        testRoute: `${testRoute}/${testHash}`,
        testText: 'Showing the test route'
    };

    beforeEach(async () => {
        $test = await runSetup({
            containerProps: {
                componentProps: {
                    className: componentClassName,
                    value: testValue
                },
                TestComponent: Router
            }
        });
        $unit = $test.querySelector(`.${componentClassName}`);
        $anchorDefault = $unit?.querySelector(`a[href="${defaultRoute}"]`);
        $anchorTest = $unit?.querySelector(`.${testValue.pushRouteClassname}`);
        $anchorReplaceTest = $unit?.querySelector(
            `.${testValue.replaceRouteClassname}`
        );
        $routerContainer = $unit?.querySelector('div');
    });

    describe('locationEffect()', () => {
        it('should render from the current location with no route table', () => {
            expect($routerContainer?.textContent?.trim()).to.equal(
                testValue.defaultText
            );
        });

        it('should re-render on every navigation', () => {
            const checkRouteDidLoad = (
                $anchor: HTMLAnchorElement | null | undefined,
                text?: string
            ) => {
                $anchor?.click();
                expect($routerContainer?.textContent?.trim()).to.equal(text);
            };

            checkRouteDidLoad($anchorDefault, testValue.defaultText);
            checkRouteDidLoad($anchorTest, testValue.testText);
            checkRouteDidLoad($anchorReplaceTest, testValue.replaceText);
        });
    });

    describe('watchLocation()', () => {
        it('should observe navigation with no route table & stop after unsubscribe', () => {
            const handler = sinon.fake();
            const unsubscribe = watchLocation(handler);
            // The watcher fires immediately on registration with the current
            // location — count from there.
            const initialCallCount = handler.callCount;

            route(null, { href: '/watch-location-a', replace: true });

            expect(handler.callCount).to.equal(initialCallCount + 1);
            expect(handler.lastCall.args[0].value.pathname).to.equal(
                '/watch-location-a'
            );

            unsubscribe();
            route(null, { href: '/watch-location-b', replace: true });

            expect(handler.callCount).to.equal(initialCallCount + 1);
        });
    });

    describe('one pipeline (layer separation)', () => {
        it('should expose the location layer without waking the route layer', () => {
            // No route table exists in this spec file, so the route activity's
            // transform never emits — `watchRoute` fires only its immediate
            // registration call, even as locations change.
            const routeHandler = sinon.fake();
            const unsubscribe = watchRoute(routeHandler);
            const initialCallCount = routeHandler.callCount;

            route(null, { href: '/no-route-table', replace: true });

            expect(routeHandler.callCount).to.equal(initialCallCount);
            unsubscribe();
        });
    });
});
