import { expect } from '@esm-bundle/chai';
import { activity, component, init } from '@loom-js/core';
import type { DevtoolsBackend } from '@loom-js/core/devtools';
import sinon from 'sinon';

import { createBackend } from '../src/backend';
import { loomFormatter } from '../src/backend/formatters';
import { type Client, createClient } from '../src/frontend/client';
import { createTransport, envelope } from '../src/protocol/transport';
import type {
    ActivityRecord,
    Envelope,
    Events,
    EventType,
    NodeDetails,
    TreeNode
} from '../src/protocol/types';

// Specs for the backend half of `devtools-protocol` and `devtools-inspector`,
// over a loopback harness: the page window is both the backend's peer and
// the client's, so every message takes the real `postMessage` path.

// Outlasts one flush — a frame, or the timer fallback in a background page.
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 150));

const labels = activity(['a', 'b'], { label: 'labels' });
const flag = activity(false, { label: 'flag' });
const registry = activity(new Map([['k', 1]]), { label: 'registry' });
const clicked = sinon.spy();

const Item = component<{ label: string }>(
    (html, { label }) => html`
        <li data-item>${label}</li>
    `,
    { name: 'Item' }
);
const App = component(
    (html) => html`
        <section data-app>
            <button data-button $click=${clicked} type="button">press</button>
            <p data-flag=${flag.bind((value) => String(value))}>flag</p>
            <ul>
                ${labels.effect(({ value }) =>
                    value.map((label) => Item({ key: label, label }))
                )}
            </ul>
            <output>${registry.effect(({ value }) => value.size)}</output>
        </section>
    `,
    { name: 'App' }
);

// Sends one raw request and resolves with the response envelope.
const rawRequest = (fields: Partial<Envelope> & { type: string }) =>
    new Promise<Envelope>((resolve) => {
        const transport = createTransport(window);
        const id = 9000 + Math.floor(Math.random() * 1000);
        const stop = transport.listen(
            (source) => source === window,
            (message) => {
                if (message.kind === 'response' && message.id === id) {
                    stop();
                    resolve(message);
                }
            }
        );

        transport.post(window, {
            ...envelope({
                id,
                kind: 'request',
                session: '',
                type: fields.type
            }),
            ...fields,
            id
        } as Envelope);
    });

const nextEvent = <Type extends EventType>(client: Client, type: Type) =>
    new Promise<Events[Type]>((resolve) => {
        let done = false;

        client.on(type, (payload) => {
            done || resolve(payload);
            done = true;
        });
    });

describe('devtools backend', () => {
    let backend: DevtoolsBackend;
    let client: Client;
    let tree: TreeNode[];
    const byName = (name: string) => tree.find((node) => node.name === name)!;

    before(async () => {
        const root = document.createElement('div');

        document.body.append(root);
        init({ app: App(), root });
        backend = createBackend(window, {
            acceptPeer: (source) => source === window
        });
    });

    after(() => backend.deactivate());

    describe('handshake', () => {
        it('rejects requests before hello', async () => {
            const response = await rawRequest({ type: 'tree.get' });

            expect(response.error?.code).to.equal('not-connected');
        });

        it('refuses another protocol version', async () => {
            const response = await rawRequest({ protocol: 2, type: 'hello' });

            expect(response.error?.code).to.equal('protocol-mismatch');
        });

        it('answers hello with the session and features', async () => {
            client = createClient(window, window);

            const hello = new Promise((resolve) => client.onConnected(resolve));

            client.connect();
            expect(await hello).to.include({ placement: 'unknown' });
            expect(
                ((await hello) as { features: string[] }).features
            ).to.include.members(['tree', 'activities']);
        });
    });

    describe('reading the app', () => {
        before(async () => {
            tree = (await client.request('tree.get')).nodes;
        });

        it('reports the tree with names, keys and boundaries', () => {
            const boundary = byName('⟨labels⟩');

            expect(byName('App').kind).to.equal('component');
            expect(boundary.kind).to.equal('effect');
            expect(
                boundary.childIds.map(
                    (id) => tree.find((node) => node.id === id)!.key
                )
            ).to.deep.equal(['a', 'b']);
        });

        it('inspects an instance and expands by path', async () => {
            const details = (await client.request('node.inspect', {
                id: byName('Item').id
            })) as NodeDetails;
            const deep = await client.request('node.inspect', {
                id: byName('Item').id,
                path: ['props', 'label']
            });

            expect(details).to.include({ kind: 'component', name: 'Item' });
            expect(deep).to.deep.equal({ value: { t: 'str', v: 'a' } });
        });

        it('attributes bound and effect activities to their instance', async () => {
            const details = (await client.request('node.inspect', {
                id: byName('App').id
            })) as NodeDetails;

            expect(details.activities.map(({ name }) => name)).to.have.members([
                '⟨flag⟩',
                '⟨labels⟩',
                '⟨registry⟩'
            ]);
        });

        it('fails an unknown id', async () => {
            const error = await client
                .request('node.inspect', { id: 99999 })
                .catch(
                    (caught: { error: { code: string } }) => caught.error.code
                );

            expect(error).to.equal('unknown-id');
        });

        it('keeps ids across re-renders', async () => {
            const appId = byName('App').id;

            labels.update(['a', 'b', 'c']);

            const next = (await client.request('tree.get')).nodes;

            expect(next.find((node) => node.name === 'App')!.id).to.equal(
                appId
            );
            labels.update(['a', 'b']);
        });
    });

    describe('activities', () => {
        let records: ActivityRecord[];
        const record = (name: string) =>
            records.find((candidate) => candidate.name === name)!;

        before(async () => {
            records = (await client.request('activity.list')).activities;
        });

        it('lists activities with their users and editability', () => {
            expect(record('⟨labels⟩').subscriberIds).to.have.length(1);
            expect(record('⟨flag⟩').editable).to.be.true;
            expect(record('⟨registry⟩').editable).to.be.false;
        });

        it('applies an edit through the activity and reports the commit', async () => {
            await client.request('subscribe', {
                topics: ['activities', 'tree']
            });

            const changed = nextEvent(client, 'activity.changed');

            await client.request('activity.update', {
                id: record('⟨flag⟩').id,
                input: true
            });

            expect(
                document.querySelector('[data-flag]')!.getAttribute('data-flag')
            ).to.equal('true');
            expect(await changed).to.deep.include({
                id: record('⟨flag⟩').id,
                value: { t: 'bool', v: true }
            });
        });

        it('refuses non-JSON input and non-JSON values', async () => {
            const codeOf = (promise: Promise<unknown>) =>
                promise.catch(
                    (caught: { error: { code: string } }) => caught.error.code
                );

            expect(
                await codeOf(
                    client.request('activity.update', {
                        id: record('⟨flag⟩').id,
                        input: new Date()
                    })
                )
            ).to.equal('invalid-value');
            expect(
                await codeOf(
                    client.request('activity.update', {
                        id: record('⟨registry⟩').id,
                        input: {}
                    })
                )
            ).to.equal('not-editable');
        });

        it('coalesces a burst of updates into one event per frame', async () => {
            const seen: unknown[] = [];

            client.on('activity.changed', ({ id, value }) => {
                id === record('⟨flag⟩').id && seen.push(value);
            });
            await nextFrame();

            for (let index = 0; index < 50; index++) {
                flag.update(index % 2 === 0);
            }

            await nextFrame();
            expect(seen).to.deep.equal([{ t: 'bool', v: false }]);
        });
    });

    describe('push topics', () => {
        it('reports renders and records performance tracks when subscribed', async () => {
            const measure = sinon.spy(performance, 'measure');

            try {
                await client.request('subscribe', {
                    topics: ['renders', 'perf']
                });

                const renders = nextEvent(client, 'renders');

                labels.update(['b', 'a']);

                expect((await renders).entries.length).to.be.greaterThan(0);
                expect(
                    measure
                        .getCalls()
                        .some(
                            ({ args }) =>
                                (args[1] as PerformanceMeasureOptions)?.detail
                                    ?.devtools?.track === 'Renders'
                        )
                ).to.be.true;
            } finally {
                measure.restore();
            }
        });

        it('pushes nothing with no topics subscribed', async () => {
            const listener = sinon.spy();

            await client.request('subscribe', { topics: [] });
            client.on('renders', listener);
            client.on('tree.changed', listener);
            labels.update(['a', 'b']);
            await nextFrame();
            expect(listener.called).to.be.false;
        });
    });

    describe('page interaction', () => {
        it('picks the owner of a clicked element without the app seeing the click', async () => {
            const selected = nextEvent(client, 'selected');

            await client.request('pick', { on: true });
            (
                document.querySelector('[data-button]') as HTMLButtonElement
            ).click();

            const { id } = await selected;
            const node = (await client.request('tree.get')).nodes.find(
                (candidate) => candidate.id === id
            );

            expect(node?.name).to.equal('App');
            expect(clicked.called).to.be.false;
        });

        it('logs a live activity to the page console as $loom', async () => {
            const log = sinon.stub(console, 'log');
            const flagRecord = (
                await client.request('activity.list')
            ).activities.find(({ name }) => name === '⟨flag⟩')!;

            try {
                await client.request('log', { id: flagRecord.id });
                expect(
                    (window as unknown as { $loom: unknown }).$loom
                ).to.equal(flag);
            } finally {
                log.restore();
            }
        });

        it('scrolls an instance into view', async () => {
            const scroll = sinon.spy(Element.prototype, 'scrollIntoView');

            try {
                await client.request('reveal', { id: byName('App').id });
                expect(scroll.called).to.be.true;
            } finally {
                scroll.restore();
            }
        });

        it('formats console-API records for custom formatters', () => {
            const record = (
                globalThis as unknown as {
                    loom: { inspect(node: Node): unknown };
                }
            ).loom.inspect(document.querySelector('[data-item]')!);

            expect(loomFormatter.header(record)).to.deep.include('span');
            expect(JSON.stringify(loomFormatter.header(record))).to.include(
                'Item'
            );
            expect(loomFormatter.hasBody(record)).to.be.true;
            expect(loomFormatter.header({ plain: true })).to.be.null;
        });
    });

    describe('sessions', () => {
        it('reconnects to a new backend after the old one says goodbye', async () => {
            const sessions: string[] = [];
            const reconnected = new Promise<void>((resolve) =>
                client.onConnected(({ session }) => {
                    sessions.push(session);
                    resolve();
                })
            );

            backend.deactivate();
            backend = createBackend(window, {
                acceptPeer: (source) => source === window
            });
            await reconnected;

            expect(sessions).to.have.length(1);
            expect(
                (await client.request('tree.get')).nodes.length
            ).to.be.greaterThan(0);
        });
    });

    describe('console API', () => {
        const consoleKeys = ['activities', 'inspect', 'tree'];
        const loom = () =>
            (globalThis as unknown as { loom: Record<string, unknown> }).loom;

        it('is on the loom global only while devtools runs', () => {
            expect(loom()).to.include.all.keys(...consoleKeys);
            backend.deactivate();
            expect(loom()).to.not.have.any.keys(...consoleKeys);
            backend = createBackend(window, {
                acceptPeer: (source) => source === window
            });
            expect(loom()).to.include.all.keys(...consoleKeys);
        });
    });
});
