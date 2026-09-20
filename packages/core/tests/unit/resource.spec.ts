// The keyed resource cache — the dehydration seam. The cache is
// window-lifetime by design, so every test uses its own key namespace
// (`res:<case>:`) instead of expecting a reset.
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { primeResources, resource } from '../../src';
import { DomWindow, withWindow } from '../../src/lib/dom';

describe('resource', () => {
    it('should invoke the fetcher once per key and resolve later calls from cache', async () => {
        const fetcher = sinon.fake.resolves('value-a');

        const first = await resource('res:memo:key', fetcher);
        const second = await resource('res:memo:key', fetcher);

        expect(fetcher.callCount).to.equal(1);
        expect(first).to.equal('value-a');
        expect(second).to.equal('value-a');
    });

    it('should share the in-flight promise across concurrent callers', async () => {
        let releaseFetch!: (value: string) => void;
        const fetcher = sinon.fake(
            () => new Promise<string>((resolve) => (releaseFetch = resolve))
        );

        const first = resource('res:concurrent:key', fetcher);
        const second = resource('res:concurrent:key', fetcher);

        expect(fetcher.callCount).to.equal(1);

        releaseFetch('shared-value');

        expect(await first).to.equal('shared-value');
        expect(await second).to.equal('shared-value');
    });

    it('should scope the cache per window — each window runs its own fetch', async () => {
        const windowA = {} as DomWindow;
        const windowB = {} as DomWindow;
        const fetcherA = sinon.fake.resolves('value-window-a');
        const fetcherB = sinon.fake.resolves('value-window-b');

        const fromA = withWindow(windowA, () =>
            resource('res:isolation:key', fetcherA)
        );
        const fromB = withWindow(windowB, () =>
            resource('res:isolation:key', fetcherB)
        );

        expect(await fromA).to.equal('value-window-a');
        expect(await fromB).to.equal('value-window-b');
        expect(fetcherA.callCount).to.equal(1);
        expect(fetcherB.callCount).to.equal(1);
    });

    it('should reject sharing callers on a failed fetch, evict, and retry on the next call', async () => {
        const fetchError = new Error('fetch failed');
        const fetcher = sinon.stub<[], Promise<string>>();

        fetcher.onFirstCall().rejects(fetchError);
        fetcher.onSecondCall().resolves('retried-value');

        const first = resource('res:rejection:key', fetcher);
        const second = resource('res:rejection:key', fetcher);
        const outcomes = await Promise.allSettled([first, second]);

        outcomes.forEach((outcome) => {
            expect(outcome.status).to.equal('rejected');
            expect((outcome as PromiseRejectedResult).reason).to.equal(
                fetchError
            );
        });

        const retried = await resource('res:rejection:key', fetcher);

        expect(retried).to.equal('retried-value');
        expect(fetcher.callCount).to.equal(2);
    });
});

// Mirrors the real client path — `JSON.parse` of embedded text — which is
// untyped, and exactly where hand-rolled payloads come from.
const asParsedJson = (payload: object) => JSON.parse(JSON.stringify(payload));

describe('primeResources', () => {
    it('should resolve keys primed from a v1 envelope without ever invoking the fetcher', async () => {
        const fetcher = sinon.fake.resolves('network-value');

        primeResources({
            __loom: 1,
            state: { 'prime:hit:key': 'primed-value' }
        });

        const value = await resource('prime:hit:key', fetcher);

        expect(value).to.equal('primed-value');
        expect(fetcher.callCount).to.equal(0);
    });

    it('should leave unprimed keys fetching exactly as before', async () => {
        const fetcher = sinon.fake.resolves('network-value');

        primeResources({
            __loom: 1,
            state: { 'prime:other:key': 'primed-value' }
        });

        const value = await resource('prime:unprimed:key', fetcher);

        expect(value).to.equal('network-value');
        expect(fetcher.callCount).to.equal(1);
    });

    it('should prime nothing from a bare payload and warn once pointing at serializeState', async () => {
        const warn = sinon.stub(globalThis.console, 'warn');

        try {
            primeResources(asParsedJson({ 'prime:bare:key': 'hand-rolled' }));

            expect(warn.callCount).to.equal(1);
            expect(String(warn.firstCall.args.join(' '))).to.contain(
                'serializeState'
            );
        } finally {
            warn.restore();
        }

        // The rejected boot proceeds unprimed — the key fetches normally.
        const fetcher = sinon.fake.resolves('network-value');
        const value = await resource('prime:bare:key', fetcher);

        expect(value).to.equal('network-value');
        expect(fetcher.callCount).to.equal(1);
    });

    it('should prime nothing from an unknown envelope version and warn once naming the mismatch', async () => {
        const warn = sinon.stub(globalThis.console, 'warn');

        try {
            primeResources(
                asParsedJson({
                    __loom: 2,
                    state: { 'prime:future:key': 'from-the-future' }
                })
            );

            expect(warn.callCount).to.equal(1);
            expect(String(warn.firstCall.args.join(' '))).to.contain('version');
        } finally {
            warn.restore();
        }

        const fetcher = sinon.fake.resolves('network-value');
        const value = await resource('prime:future:key', fetcher);

        expect(value).to.equal('network-value');
        expect(fetcher.callCount).to.equal(1);
    });
});
