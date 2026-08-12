import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { request } from '../../src/http/request';

// Specs for the `http-request-caching` capability (`fix-request-cache-dedup`):
// successful responses cache per request signature, a changed `cacheKey`
// busts the cached entry, and concurrent identical requests share one flight.

// The module-level caches inside `request` persist for the test page's
// lifetime, so every test uses its own unique URL to stay isolated.
let urlCounter = 0;
const uniqueUrl = () => `/request-cache-spec/${++urlCounter}`;

const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
        status,
        statusText: status === 200 ? 'OK' : 'Server Error'
    });

describe('request caching & dedup', () => {
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('signature caching', () => {
        it('serves a repeat call from cache without fetching', async () => {
            const url = uniqueUrl();

            fetchStub.resolves(jsonResponse({ topic: 'routing' }));

            const first = await request<{ topic: string }, { topic: string }>(
                url,
                {}
            );
            const second = await request<{ topic: string }, { topic: string }>(
                url,
                {}
            );

            expect(fetchStub.callCount).to.equal(1);
            expect(first.data?.topic).to.equal('routing');
            expect(second.data?.topic).to.equal('routing');
        });

        it('does not cache failed responses', async () => {
            const url = uniqueUrl();

            fetchStub.onFirstCall().resolves(jsonResponse({}, 500));
            fetchStub.onSecondCall().resolves(jsonResponse({ ok: true }));

            const failed = await request<{ ok: boolean }, { ok: boolean }>(
                url,
                {}
            );
            const retried = await request<{ ok: boolean }, { ok: boolean }>(
                url,
                {}
            );

            expect(failed.error).to.be.a('string');
            expect(fetchStub.callCount).to.equal(2);
            expect(retried.data?.ok).to.equal(true);
        });
    });

    describe('cacheKey busting', () => {
        it('re-fetches when the cacheKey changes, including back to a prior value', async () => {
            const url = uniqueUrl();

            fetchStub.callsFake(() =>
                Promise.resolve(
                    jsonResponse({ fetchedAt: fetchStub.callCount })
                )
            );

            await request(url, { cacheKey: ['a'] });
            expect(fetchStub.callCount).to.equal(1);

            // Changed key busts the entry.
            await request(url, { cacheKey: ['b'] });
            expect(fetchStub.callCount).to.equal(2);

            // Cycling back to a prior key must fetch again — the old entry
            // was busted, not parked in a parallel cache slot.
            await request(url, { cacheKey: ['a'] });
            expect(fetchStub.callCount).to.equal(3);
        });

        it('serves from cache while the cacheKey is unchanged', async () => {
            const url = uniqueUrl();

            fetchStub.resolves(jsonResponse({ stable: true }));

            await request(url, { cacheKey: ['a', 1] });
            const repeat = await request<
                { stable: boolean },
                { stable: boolean }
            >(url, { cacheKey: ['a', 1] });

            expect(fetchStub.callCount).to.equal(1);
            expect(repeat.data?.stable).to.equal(true);
        });
    });

    describe('single-flight dedup', () => {
        it('shares one fetch among concurrent identical calls', async () => {
            const url = uniqueUrl();
            let resolveFetch: (response: Response) => void;

            fetchStub.returns(
                new Promise<Response>((resolve) => {
                    resolveFetch = resolve;
                })
            );

            const first = request<{ shared: boolean }, { shared: boolean }>(
                url,
                {}
            );
            const second = request<{ shared: boolean }, { shared: boolean }>(
                url,
                {}
            );

            resolveFetch!(jsonResponse({ shared: true }));

            const [firstResult, secondResult] = await Promise.all([
                first,
                second
            ]);

            expect(fetchStub.callCount).to.equal(1);
            expect(firstResult.error).to.equal(undefined);
            expect(secondResult.error).to.equal(undefined);
            expect(firstResult.data?.shared).to.equal(true);
            expect(secondResult.data?.shared).to.equal(true);
        });

        it('starts a fresh fetch after a shared flight fails', async () => {
            const url = uniqueUrl();

            fetchStub.onFirstCall().resolves(jsonResponse({}, 500));
            fetchStub.onSecondCall().resolves(jsonResponse({ ok: true }));

            const [firstResult, secondResult] = await Promise.all([
                request(url, {}),
                request(url, {})
            ]);

            // Both sharers see the one failure...
            expect(fetchStub.callCount).to.equal(1);
            expect(firstResult.error).to.be.a('string');
            expect(secondResult.error).to.be.a('string');

            // ...and the registry is clean: the next call fetches fresh.
            const retried = await request<{ ok: boolean }, { ok: boolean }>(
                url,
                {}
            );

            expect(fetchStub.callCount).to.equal(2);
            expect(retried.data?.ok).to.equal(true);
        });
    });
});
