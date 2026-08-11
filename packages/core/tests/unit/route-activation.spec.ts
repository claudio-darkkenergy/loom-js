import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { route } from '../../src';
import type { SyntheticRouteEvent } from '../../src';

// Specs for the router's link-activation policy
// (`fix-router-activation-policy` design Decision 1): the SPA router claims
// only plain, unconsumed activations — modified clicks and events another
// handler already consumed fall through to the browser.

describe('route() activation policy', () => {
    const originalHref = window.location.href;

    const makeActivation = (
        overrides: Partial<SyntheticRouteEvent<HTMLAnchorElement>> = {}
    ) => {
        const anchor = document.createElement('a');

        anchor.href = '/activation-target';

        return {
            altKey: false,
            ctrlKey: false,
            currentTarget: anchor,
            defaultPrevented: false,
            metaKey: false,
            preventDefault: sinon.fake(),
            shiftKey: false,
            target: anchor,
            ...overrides
        } as unknown as SyntheticRouteEvent<HTMLAnchorElement> & {
            preventDefault: sinon.SinonSpy;
        };
    };

    afterEach(() => {
        window.history.replaceState({}, '', originalHref);
    });

    it('should route a plain left-click via the History API', () => {
        const activation = makeActivation();

        route(activation);

        expect(activation.preventDefault.calledOnce, 'default prevented').to.be
            .true;
        expect(window.location.pathname).to.equal('/activation-target');
    });

    for (const modifier of [
        'altKey',
        'ctrlKey',
        'metaKey',
        'shiftKey'
    ] as const) {
        it(`should leave ${modifier} activations to the browser`, () => {
            const pathnameBefore = window.location.pathname;
            const activation = makeActivation({ [modifier]: true });

            route(activation);

            expect(activation.preventDefault.called, 'default left alone').to.be
                .false;
            expect(window.location.pathname).to.equal(pathnameBefore);
        });
    }

    it('should leave already-consumed activations to the browser', () => {
        const pathnameBefore = window.location.pathname;
        const activation = makeActivation({ defaultPrevented: true });

        route(activation);

        expect(activation.preventDefault.called, 'not re-claimed').to.be.false;
        expect(window.location.pathname).to.equal(pathnameBefore);
    });
});
