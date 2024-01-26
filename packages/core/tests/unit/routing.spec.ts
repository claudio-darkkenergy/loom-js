import { expect } from '@esm-bundle/chai';
import { sanitizeLocation } from '../../src/routing';
import { Router, RouterPropValue } from '../support/components/router';
import { runSetup } from '../support/run-setup';

describe('routing', () => {
    let $test: HTMLElement;
    let $unit: HTMLElement | null;
    let $anchorDefault: HTMLAnchorElement | null | undefined;
    let $anchorTest: HTMLAnchorElement | null | undefined;
    let $anchorReplaceTest: HTMLAnchorElement | null | undefined;
    let $routerContainer: HTMLDivElement | null | undefined;
    const componentClassName = 'routing-test';
    const testHash = '#test-hash';
    const defaultRoute = `/`;
    const replaceRoute = `/replace-route`;
    const testRoute = `/test-route`;
    const testValue: RouterPropValue = {
        defaultRoute,
        defaultText: 'Showing the default route',
        pushRouteClassname: 'test-route',
        // replaceRoute: `${testRoute}/#replace-hash`,
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

    describe('router()', () => {
        it('should load the default route', () => {
            expect($routerContainer?.textContent?.trim()).to.equal(
                testValue.defaultText
            );
        });
    });

    describe('onRoute()', () => {
        it('should load the route', () => {
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

    describe('sanitizeLocation()', () => {
        it('should return a sanitized `Location` object', () => {
            let sanitized: Location;
            const checkSanitizedPathname = (
                $anchor: HTMLAnchorElement | null | undefined,
                expectedRoute: string
            ) => {
                $anchor?.click();
                sanitized = sanitizeLocation(window.location);
                expect(sanitized.pathname).to.equal(expectedRoute);
            };

            checkSanitizedPathname($anchorDefault, defaultRoute);
            checkSanitizedPathname($anchorTest, testRoute);
            checkSanitizedPathname($anchorReplaceTest, replaceRoute);
        });
    });
});
