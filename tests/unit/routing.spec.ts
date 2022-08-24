import { expect } from '@esm-bundle/chai';
import { sanitizeLocation } from '../../src/routing';
import { Router, RouterPropValue } from '../support/components/router';
import { runSetup } from '../support/run-setup';

describe('routing', () => {
    let $test: HTMLElement;
    let $unit: HTMLElement | null;
    let $anchorDefault: HTMLAnchorElement | null | undefined;
    let $anchorTest: HTMLAnchorElement | null | undefined;
    let $routerContainer: HTMLDivElement | null | undefined;
    const componentClassName = 'routing-test';
    const testHash = '#test-hash';
    const testRoute = `/test-route`;
    const testValue: RouterPropValue = {
        defaultText: 'Showing the default route',
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
        $anchorDefault = $unit?.querySelector('a[href="/"]');
        $anchorTest = $unit?.querySelector(`a[href="${testValue.testRoute}"]`);
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
        it('should load the test route', () => {
            $anchorTest?.click();
            expect($routerContainer?.textContent?.trim()).to.equal(
                testValue.testText
            );
        });
    });

    describe('sanitizeLocation()', () => {
        it('should return a sanitized `Location` object', () => {
            let sanitized: Location;

            $anchorTest?.click();
            sanitized = sanitizeLocation(window.location);
            expect(sanitized.pathname).to.equal(testRoute);
        });
    });

    afterEach(() => {
        $test?.remove();
    });
});
