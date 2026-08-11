import { expect } from '@esm-bundle/chai';

import { RouteLink, component } from '../../../src';
import { runSetup } from '../../support/run-setup';

// Specs for `RouteLink` (`add-core-element-components` design Decision 3):
// SPA-eligible activations delegate to the core router; new-tab targets and
// cross-origin hrefs fall through to the browser default.

describe('RouteLink', () => {
    const originalHref = window.location.href;
    // Lets RouteLink's own handler run first (target phase), records whether
    // it prevented the default, then always prevents so the test iframe
    // never actually navigates.
    const clickThroughGuard = () => {
        const result = { defaultPrevented: false };
        const guard = (event: Event) => {
            result.defaultPrevented = event.defaultPrevented;
            event.preventDefault();
        };

        document.addEventListener('click', guard);
        return {
            result,
            restore: () => document.removeEventListener('click', guard)
        };
    };

    afterEach(() => {
        window.history.replaceState({}, '', originalHref);
    });

    it('should route internal hrefs via the router without a page load', async () => {
        const TestComponent = component(
            (html) => html`
                <main><${RouteLink} href="/spa-target">go</></main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $anchor = $test.querySelector('a');
        const guard = clickThroughGuard();

        expect($anchor, 'anchor rendered').to.exist;
        expect($anchor?.textContent).to.contain('go');

        $anchor?.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
        );
        guard.restore();

        expect(guard.result.defaultPrevented, 'router took the activation').to
            .be.true;
        expect(window.location.pathname).to.equal('/spa-target');
    });

    it('should leave target="_blank" activations to the browser', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${RouteLink} href="/elsewhere" target="_blank">out</>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $anchor = $test.querySelector('a');
        const pathnameBefore = window.location.pathname;
        const guard = clickThroughGuard();

        $anchor?.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
        );
        guard.restore();

        expect(guard.result.defaultPrevented, 'router stayed out').to.be.false;
        expect(window.location.pathname).to.equal(pathnameBefore);
    });

    it('should leave cross-origin hrefs to the browser', async () => {
        const TestComponent = component(
            (html) => html`
                <main>
                    <${RouteLink} href="https://example.com/away">ext</>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $anchor = $test.querySelector('a');
        const pathnameBefore = window.location.pathname;
        const guard = clickThroughGuard();

        $anchor?.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
        );
        guard.restore();

        expect(guard.result.defaultPrevented, 'router stayed out').to.be.false;
        expect(window.location.pathname).to.equal(pathnameBefore);
    });

    it('should apply no active-state affordance', async () => {
        const currentPath = window.location.pathname;
        const TestComponent = component(
            (html) => html`
                <main>
                    <${RouteLink} className="plain" href=${currentPath}>
                        here
                    </>
                </main>
            `
        );

        const $test = await runSetup({ containerProps: { TestComponent } });
        const $anchor = $test.querySelector('a');

        expect($anchor?.getAttribute('class')).to.equal('plain');
        expect($anchor?.hasAttribute('aria-current')).to.be.false;
        expect($anchor?.hasAttribute('data-active')).to.be.false;
    });
});
