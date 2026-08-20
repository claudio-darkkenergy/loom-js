// End-to-end dehydration proof: `renderToString` an app whose transform
// loads through `resource` (the browser stands in for the server runtime),
// `dehydrate` the render's settled values, round-trip them through the
// script-safe serializer, `primeResources` on the client, then `hydrate` —
// and assert the client never invoked its fetcher and the final DOM matches
// the served markup.
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
    activity,
    component,
    hydrate,
    primeResources,
    resource
} from '../../src';
import { dehydrate, renderToString, serializeState } from '../../src/server';
import { createServerWindow } from '../support/server-window';

const PAGE_KEY = 'e2e:dehydrated-page';

interface PageData {
    title: string;
}

// Server and client each get their own app instance (separate JS contexts in
// production) — a fresh activity per instance keeps the client's transform
// honest: it must resolve through `resource`, not through state left over
// from the server render.
const createApp = (fetcher: () => Promise<PageData>) => {
    const page = activity<PageData | undefined>(
        undefined,
        async ({ update }) => {
            update(await resource(PAGE_KEY, fetcher));
        }
    );

    return component((html, { onCreated }) => {
        onCreated(() => page.update(undefined));

        return html`
            <main>
                <h1>
                    ${page.effect(({ value }) =>
                        value ? value.title : 'loading'
                    )}
                </h1>
            </main>
        `;
    });
};

describe('dehydrated state end-to-end', () => {
    it('should hydrate from primed state with zero client fetches and a matching final DOM', async () => {
        const serverFetcher = sinon.fake.resolves({
            title: 'Dehydrated & <primed> title'
        });
        const ServerApp = createApp(serverFetcher);
        const serverWindow = createServerWindow();
        const serverMarkup = await renderToString(ServerApp(), {
            window: serverWindow
        });

        expect(serverMarkup).to.contain('Dehydrated');
        expect(serverFetcher.callCount).to.equal(1);

        // The explicit transport: capture, serialize as the page would embed
        // it, and read it back the way a client boot would.
        const embedded = serializeState(dehydrate(serverWindow));
        const primedState = JSON.parse(embedded);

        // "Serve" the markup into a root the client boots on.
        const root = document.createElement('div');

        root.innerHTML = serverMarkup;
        document.body.append(root);

        const clientFetcher = sinon.fake.resolves({
            title: 'network title — must never render'
        });
        const ClientApp = createApp(clientFetcher);

        primeResources(primedState);
        await hydrate({ app: ClientApp(), root });

        expect(clientFetcher.callCount).to.equal(0);
        expect(root.innerHTML).to.equal(serverMarkup);
        expect(root.querySelector('h1')?.textContent).to.contain(
            'Dehydrated & <primed> title'
        );

        root.remove();
    });
});
